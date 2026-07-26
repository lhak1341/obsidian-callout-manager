import { App } from 'obsidian';

import type { Callout, CalloutID } from '../api';
import { CalloutCollection } from './callout-collection';
import { CalloutSettings } from './callout-settings';
import { CalloutStore } from './callout-store';
import Settings from './settings';

const IMPOSSIBLE_CALLOUT_ID = '[not a real callout]';

export class CalloutRepository implements CalloutStore {
	public readonly app: App;
	private readonly settings: Settings;
	private readonly callouts: CalloutCollection;
	private readonly resolve: (id: string) => { color: string; icon: string };
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
		this.resolve = resolve;
		this.onSave = onSave;
		this.onCalloutChanged = onCalloutChanged;

		this.callouts = new CalloutCollection((id) => {
			const { icon, color } = resolve(id);
			return { id, icon, color };
		});

		this.callouts.custom.add(...settings.callouts.custom);
	}

	public getDefaultCalloutProperties(): { color: string; icon: string } {
		return this.resolve(IMPOSSIBLE_CALLOUT_ID);
	}

	public getCallouts(): Callout[] {
		return this.callouts.values();
	}

	public getCallout(id: CalloutID): Callout | undefined {
		return this.callouts.get(id);
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

	public getIconColorAdjust(scheme: 'light' | 'dark'): { saturation: number; lightness: number } {
		return { ...this.settings.iconColorAdjust[scheme] };
	}

	public setIconColorAdjust(scheme: 'light' | 'dark', adjust: { saturation: number; lightness: number }): void {
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
		this.callouts.custom.add(id);
		this.settings.callouts.custom = this.callouts.custom.keys();
		this.onSave(this.settings);
		this.onCalloutChanged(id);
	}

	public renameCustomCallout(oldId: CalloutID, newId: CalloutID): void {
		const callout = this.callouts.get(oldId);
		if (callout == null) throw new Error(`Callout '${oldId}' does not exist.`);
		if (this.callouts.get(newId) != null) throw new Error(`Callout '${newId}' already exists.`);
		if (callout.sources.length !== 1 || callout.sources[0].type !== 'custom') {
			throw new Error(`Cannot rename non-custom callout '${oldId}'.`);
		}

		this.callouts.custom.delete(oldId);
		this.callouts.custom.add(newId);
		this.settings.callouts.custom = this.callouts.custom.keys();
		this.settings.callouts.settings[newId] = this.settings.callouts.settings[oldId];
		delete this.settings.callouts.settings[oldId];

		this.onSave(this.settings);
		this.onCalloutChanged(oldId);
		this.onCalloutChanged(newId);
	}

	public removeCustomCallout(id: CalloutID): void {
		this.callouts.custom.delete(id);
		this.settings.callouts.custom = this.callouts.custom.keys();

		const calloutInstance = this.callouts.get(id);
		if (calloutInstance == null || calloutInstance.sources.length < 1) {
			delete this.settings.callouts.settings[id];
		}

		this.onSave(this.settings);
		this.onCalloutChanged(id);
	}
}
