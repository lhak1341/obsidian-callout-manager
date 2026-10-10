import { App } from 'obsidian';

import type { Callout, CalloutID } from '../api';
import { CalloutCollection } from './callout-collection';
import { assembleStylesheet } from './assemble-stylesheet';
import { CalloutEnvironment, CalloutSettings } from './callout-settings';
import { CalloutStore, IconColorAdjust } from './callout-store';
import Settings from './settings';
import { assertValidCalloutId } from './util/callout-id';

/** Reads the live, CSS-resolved icon and color of a callout (Obsidian's shadow-DOM resolver in production). */
export interface CalloutProbe {
	getCalloutProperties(id: CalloutID): { icon: string; color: string };
	/** Re-reads the app's stylesheets and color scheme. Must run before {@link CalloutRepository} re-applies its CSS. */
	reloadStyles(): void;
}

/** Receives the assembled override stylesheet (the plugin's `<style>` tag plus the probe's copy in production). */
export interface StyleSink {
	setCss(css: string): void;
}

export interface CalloutRepositoryAdapters {
	probe: CalloutProbe;
	sink: StyleSink;
	environment: () => CalloutEnvironment;
	save: (data: Settings) => void;
	/** Fires once per change to callouts or their styles; consumers re-read via `getCallouts()`. */
	onChange: () => void;
}

export class CalloutRepository implements CalloutStore {
	public readonly app: App;
	private readonly settings: Settings;
	private readonly callouts: CalloutCollection;
	private readonly adapters: CalloutRepositoryAdapters;

	public constructor(app: App, settings: Settings, adapters: CalloutRepositoryAdapters) {
		this.app = app;
		this.settings = settings;
		this.adapters = adapters;

		this.callouts = new CalloutCollection((id) => {
			const { icon, color } = adapters.probe.getCalloutProperties(id);
			return { id, icon, color };
		});

		this.callouts.add(...settings.callouts.custom);
		this.applyStyles();
	}

	public getCallouts(): Callout[] {
		return this.callouts.values();
	}

	public hasCallout(id: CalloutID): boolean {
		return this.callouts.has(id);
	}

	public getAliasGroups(): Record<string, string[]> {
		return { ...this.settings.aliasGroups };
	}

	public setAliasGroup(canonical: string, aliases: string[]): void {
		assertValidCalloutId(canonical);
		aliases = [...new Set(aliases.map((a) => a.trim().toLowerCase()))];
		for (const alias of aliases) {
			assertValidCalloutId(alias);
			if (alias === canonical) throw new Error(`Callout '${canonical}' cannot be an alias of itself.`);
		}

		if (aliases.length === 0) {
			delete this.settings.aliasGroups[canonical];
		} else {
			this.settings.aliasGroups[canonical] = aliases;
		}
		this.invalidateAndNotify();
	}

	public getIconColorAdjust(scheme: 'light' | 'dark'): IconColorAdjust {
		return { ...this.settings.iconColorAdjust[scheme] };
	}

	public setIconColorAdjust(scheme: 'light' | 'dark', adjust: IconColorAdjust): void {
		this.settings.iconColorAdjust[scheme] = adjust;
		this.invalidateAndNotify();
	}

	public getCalloutSettings(id: CalloutID): CalloutSettings | undefined {
		const calloutSettings = this.settings.callouts.settings;
		if (!Object.prototype.hasOwnProperty.call(calloutSettings, id)) {
			return undefined;
		}
		return calloutSettings[id];
	}

	public setCalloutSettings(id: CalloutID, settings: CalloutSettings | undefined): void {
		const calloutSettings = this.settings.callouts.settings;

		if (settings === undefined || settings.length < 1) {
			delete calloutSettings[id];
		} else {
			calloutSettings[id] = settings;
		}

		this.invalidateAndNotify();
	}

	// No duplicate-id guard: creating over an existing id is silently idempotent, unlike
	// renameCustomCallout below (which throws). Don't assume symmetry between the two.
	public createCustomCallout(id: CalloutID): void {
		assertValidCalloutId(id);

		this.callouts.add(id);
		this.settings.callouts.custom = this.callouts.keys();
		this.invalidateAndNotify();
	}

	public renameCustomCallout(oldId: CalloutID, newId: CalloutID): void {
		assertValidCalloutId(newId);

		if (!this.callouts.has(oldId)) throw new Error(`Callout '${oldId}' does not exist.`);
		if (this.callouts.has(newId)) throw new Error(`Callout '${newId}' already exists.`);

		this.callouts.delete(oldId);
		this.callouts.add(newId);
		this.settings.callouts.custom = this.callouts.keys();
		// Only move settings that exist: an `undefined` entry would make assembleStylesheet throw.
		if (Object.prototype.hasOwnProperty.call(this.settings.callouts.settings, oldId)) {
			this.settings.callouts.settings[newId] = this.settings.callouts.settings[oldId];
			delete this.settings.callouts.settings[oldId];
		}
		// The group is keyed by canonical id, so it moves with the callout. Alias names listed in
		// other groups are free text, not references, and stay as they are.
		const aliasGroups = this.settings.aliasGroups;
		if (Object.prototype.hasOwnProperty.call(aliasGroups, oldId)) {
			aliasGroups[newId] = aliasGroups[oldId];
			delete aliasGroups[oldId];
		}

		this.invalidateAndNotify();
	}

	public removeCustomCallout(id: CalloutID): void {
		this.callouts.delete(id);
		this.settings.callouts.custom = this.callouts.keys();
		delete this.settings.callouts.settings[id];
		delete this.settings.aliasGroups[id];

		this.invalidateAndNotify();
	}

	/**
	 * Call when anything outside the plugin's settings that feeds callout styles may have changed
	 * (theme, snippets, color scheme, new windows). Order matters: the probe must reload before the
	 * stylesheet is re-seeded, and the cache must drop before consumers are notified.
	 */
	public environmentChanged(): void {
		this.adapters.probe.reloadStyles();
		this.applyStyles();
		this.callouts.invalidateAll();
		this.adapters.onChange();
	}

	private applyStyles(): void {
		this.adapters.sink.setCss(
			assembleStylesheet(
				this.settings.callouts.settings,
				this.settings.aliasGroups,
				this.adapters.environment(),
				this.settings.iconColorAdjust,
			),
		);
	}

	// Every style input (settings, aliases, icon-color adjust) can change any callout's resolved
	// color/icon, e.g. aliases inherit from their canonical, so invalidate everything.
	private invalidateAndNotify(): void {
		this.callouts.invalidateAll();
		this.save();
		this.adapters.onChange();
	}

	private save(): void {
		this.applyStyles();
		this.adapters.save(this.settings);
	}
}
