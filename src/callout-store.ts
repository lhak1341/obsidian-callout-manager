import { App } from 'obsidian';

import { Callout, CalloutID } from '&callout';
import { CalloutResolver } from './callout-resolver';
import { CalloutSettings } from './callout-settings';

export interface CalloutStore {
	readonly app: App;
	readonly calloutResolver: CalloutResolver;

	getCallouts(): Callout[];
	getCallout(id: CalloutID): Callout | undefined;
	hasCallout(id: CalloutID): boolean;

	getCalloutSettings(id: CalloutID): CalloutSettings | undefined;
	setCalloutSettings(id: CalloutID, settings: CalloutSettings | undefined): void;

	createCustomCallout(id: CalloutID): void;
	renameCustomCallout(oldId: CalloutID, newId: CalloutID): void;
	removeCustomCallout(id: CalloutID): void;

	getAliasGroups(): Record<string, string[]>;
	setAliasGroup(canonical: string, aliases: string[]): void;
}
