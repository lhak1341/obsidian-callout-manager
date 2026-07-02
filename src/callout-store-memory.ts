import { App } from 'obsidian';

import { Callout, CalloutID } from '&callout';
import { CalloutResolver } from './callout-resolver';
import { CalloutSettings } from './callout-settings';
import { CalloutStore } from './callout-store';

/**
 * An in-memory implementation of {@link CalloutStore} for use in tests.
 * Does not persist, apply styles, or touch the DOM.
 */
export class InMemoryCalloutStore implements CalloutStore {
	public readonly app: App;
	public readonly calloutResolver: CalloutResolver;

	private readonly calloutMap: Map<CalloutID, Callout>;
	private readonly settingsMap: Map<CalloutID, CalloutSettings>;
	private readonly aliasGroupsData: Record<string, string[]>;

	public constructor({
		app,
		calloutResolver,
		callouts = [],
		settings = {},
		aliasGroups = {},
	}: {
		app: App;
		calloutResolver: CalloutResolver;
		callouts?: Callout[];
		settings?: Record<CalloutID, CalloutSettings>;
		aliasGroups?: Record<string, string[]>;
	}) {
		this.app = app;
		this.calloutResolver = calloutResolver;
		this.calloutMap = new Map(callouts.map((c) => [c.id, { ...c }]));
		this.settingsMap = new Map(Object.entries(settings) as [CalloutID, CalloutSettings][]);
		this.aliasGroupsData = { ...aliasGroups };
	}

	public getCallouts(): Callout[] {
		return Array.from(this.calloutMap.values());
	}

	public getCallout(id: CalloutID): Callout | undefined {
		return this.calloutMap.get(id);
	}

	public hasCallout(id: CalloutID): boolean {
		return this.calloutMap.has(id);
	}

	public getCalloutSettings(id: CalloutID): CalloutSettings | undefined {
		return this.settingsMap.get(id);
	}

	public setCalloutSettings(id: CalloutID, settings: CalloutSettings | undefined): void {
		if (settings === undefined || settings.length < 1) {
			this.settingsMap.delete(id);
		} else {
			this.settingsMap.set(id, settings);
		}
	}

	public createCustomCallout(id: CalloutID): void {
		if (!this.calloutMap.has(id)) {
			this.calloutMap.set(id, { id, sources: [{ type: 'custom' }], icon: '', color: '' } as unknown as Callout);
		}
	}

	public renameCustomCallout(oldId: CalloutID, newId: CalloutID): void {
		const callout = this.calloutMap.get(oldId);
		if (!callout) throw new Error(`Callout '${oldId}' does not exist.`);
		if (this.calloutMap.has(newId)) throw new Error(`Callout '${newId}' already exists.`);
		this.calloutMap.delete(oldId);
		this.calloutMap.set(newId, { ...callout, id: newId });
		const s = this.settingsMap.get(oldId);
		this.settingsMap.delete(oldId);
		if (s !== undefined) this.settingsMap.set(newId, s);
	}

	public removeCustomCallout(id: CalloutID): void {
		this.calloutMap.delete(id);
		this.settingsMap.delete(id);
	}

	public getAliasGroups(): Record<string, string[]> {
		return { ...this.aliasGroupsData };
	}

	public setAliasGroup(canonical: string, aliases: string[]): void {
		if (aliases.length === 0) {
			delete this.aliasGroupsData[canonical];
		} else {
			this.aliasGroupsData[canonical] = aliases;
		}
	}
}
