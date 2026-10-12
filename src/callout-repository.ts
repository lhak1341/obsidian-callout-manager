import { App } from 'obsidian';

import type { Callout, CalloutID } from '../api';
import { assembleStylesheet } from './assemble-stylesheet';
import { CalloutEnvironment, CalloutSettings } from './callout-settings';
import { CalloutChangeSource, CalloutStore, IconColorAdjust } from './callout-store';
import Settings from './settings';
import { assertValidCalloutId } from './util/callout-id';

/**
 * The app's styling as the repository sees it: it receives the assembled override stylesheet and
 * reads back the live, CSS-resolved icon and color of a callout (the `<style>` tag plus Obsidian's
 * shadow-DOM resolver in production, see `ObsidianStyleHost`).
 */
export interface StyleHost {
	getCalloutProperties(id: CalloutID): { icon: string; color: string };
	/** Re-reads the app's stylesheets and color scheme. Must run before {@link CalloutRepository} re-applies its CSS. */
	reloadStyles(): void;
	setCss(css: string): void;
}

export interface CalloutRepositoryAdapters {
	style: StyleHost;
	environment: () => CalloutEnvironment;
	save: (data: Settings) => void;
}

export class CalloutRepository implements CalloutStore, CalloutChangeSource {
	public readonly app: App;
	private readonly settings: Settings;
	/** Resolved callouts in `settings.callouts.custom` order; `null` once any style input has changed. */
	private snapshot: Callout[] | null = null;
	private readonly adapters: CalloutRepositoryAdapters;
	private readonly listeners: Set<() => void> = new Set();

	public constructor(app: App, settings: Settings, adapters: CalloutRepositoryAdapters) {
		this.app = app;
		this.settings = settings;
		this.adapters = adapters;

		settings.callouts.custom = [...new Set(settings.callouts.custom)];
		this.applyStyles();
	}

	public subscribe(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	public getCallouts(): Callout[] {
		this.snapshot ??= this.settings.callouts.custom.map((id) => {
			const { icon, color } = this.adapters.style.getCalloutProperties(id);
			return { id, icon, color };
		});
		return [...this.snapshot];
	}

	public hasCallout(id: CalloutID): boolean {
		return this.settings.callouts.custom.includes(id);
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

		if (!this.hasCallout(id)) this.settings.callouts.custom = [...this.settings.callouts.custom, id];
		this.invalidateAndNotify();
	}

	public renameCustomCallout(oldId: CalloutID, newId: CalloutID): void {
		assertValidCalloutId(newId);

		if (!this.hasCallout(oldId)) throw new Error(`Callout '${oldId}' does not exist.`);
		if (this.hasCallout(newId)) throw new Error(`Callout '${newId}' already exists.`);

		// Moves to the end of the list; API consumers see this order.
		this.settings.callouts.custom = [...this.settings.callouts.custom.filter((c) => c !== oldId), newId];
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
		this.settings.callouts.custom = this.settings.callouts.custom.filter((c) => c !== id);
		delete this.settings.callouts.settings[id];
		delete this.settings.aliasGroups[id];

		this.invalidateAndNotify();
	}

	/**
	 * Call when anything outside the plugin's settings that feeds callout styles may have changed
	 * (theme, snippets, color scheme, new windows). Order matters: the style host must reload before the
	 * stylesheet is re-seeded, and the cache must drop before consumers are notified.
	 */
	public environmentChanged(): void {
		this.adapters.style.reloadStyles();
		this.applyStyles();
		this.snapshot = null;
		this.notify();
	}

	private applyStyles(): void {
		this.adapters.style.setCss(
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
		this.snapshot = null;
		this.save();
		this.notify();
	}

	private notify(): void {
		for (const listener of [...this.listeners]) listener();
	}

	private save(): void {
		this.applyStyles();
		this.adapters.save(this.settings);
	}
}
