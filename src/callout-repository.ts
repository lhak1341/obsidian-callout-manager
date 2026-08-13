import { App } from 'obsidian';

import type { Callout, CalloutID } from '../api';
import { CalloutCollection } from './callout-collection';
import { CalloutSettings } from './callout-settings';
import { CalloutStore, IconColorAdjust } from './callout-store';
import Settings from './settings';
import { assertValidCalloutId } from './util/callout-id';

export class CalloutRepository implements CalloutStore {
	public readonly app: App;
	private readonly settings: Settings;
	private readonly callouts: CalloutCollection;
	private readonly onSave: (data: Settings) => void;
	private readonly onCalloutChanged: (id: CalloutID) => void;

	public constructor(
		app: App,
		settings: Settings,
		resolve: (id: string) => { color: string; icon: string },
		onSave: (data: Settings) => void,
		onCalloutChanged: (id: CalloutID) => void,
	) {
		this.app = app;
		this.settings = settings;
		this.onSave = onSave;
		this.onCalloutChanged = onCalloutChanged;

		this.callouts = new CalloutCollection((id) => {
			const { icon, color } = resolve(id);
			return { id, icon, color };
		});

		this.callouts.add(...settings.callouts.custom);
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
		if (aliases.length === 0) {
			delete this.settings.aliasGroups[canonical];
		} else {
			this.settings.aliasGroups[canonical] = aliases;
		}
		this.onSave(this.settings);
	}

	public getIconColorAdjust(scheme: 'light' | 'dark'): IconColorAdjust {
		return { ...this.settings.iconColorAdjust[scheme] };
	}

	public setIconColorAdjust(scheme: 'light' | 'dark', adjust: IconColorAdjust): void {
		this.settings.iconColorAdjust[scheme] = adjust;
		this.onSave(this.settings);
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

		this.callouts.invalidate(id);
		this.onSave(this.settings);
		this.onCalloutChanged(id);
	}

	public createCustomCallout(id: CalloutID): void {
		assertValidCalloutId(id);

		this.callouts.add(id);
		this.settings.callouts.custom = this.callouts.keys();
		this.onSave(this.settings);
		this.onCalloutChanged(id);
	}

	public renameCustomCallout(oldId: CalloutID, newId: CalloutID): void {
		assertValidCalloutId(newId);

		if (!this.callouts.has(oldId)) throw new Error(`Callout '${oldId}' does not exist.`);
		if (this.callouts.has(newId)) throw new Error(`Callout '${newId}' already exists.`);

		this.callouts.delete(oldId);
		this.callouts.add(newId);
		this.settings.callouts.custom = this.callouts.keys();
		this.settings.callouts.settings[newId] = this.settings.callouts.settings[oldId];
		delete this.settings.callouts.settings[oldId];

		this.onSave(this.settings);
		this.onCalloutChanged(oldId);
		this.onCalloutChanged(newId);
	}

	public removeCustomCallout(id: CalloutID): void {
		this.callouts.delete(id);
		this.settings.callouts.custom = this.callouts.keys();
		delete this.settings.callouts.settings[id];

		this.onSave(this.settings);
		this.onCalloutChanged(id);
	}
}
