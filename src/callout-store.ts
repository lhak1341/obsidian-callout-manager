import { App } from 'obsidian';

import { Callout, CalloutID } from '&callout';
import { CalloutSettings } from './callout-settings';

export interface CalloutReader {
	readonly app: App;

	getCallouts(): Callout[];
	getCallout(id: CalloutID): Callout | undefined;
	hasCallout(id: CalloutID): boolean;

	getCalloutSettings(id: CalloutID): CalloutSettings | undefined;
}

export interface CalloutStore extends CalloutReader {
	setCalloutSettings(id: CalloutID, settings: CalloutSettings | undefined): void;

	createCustomCallout(id: CalloutID): void;
	renameCustomCallout(oldId: CalloutID, newId: CalloutID): void;
	removeCustomCallout(id: CalloutID): void;

	getAliasGroups(): Record<string, string[]>;
	setAliasGroup(canonical: string, aliases: string[]): void;

	getIconColorAdjust(scheme: 'light' | 'dark'): { saturation: number; lightness: number };
	setIconColorAdjust(scheme: 'light' | 'dark', adjust: { saturation: number; lightness: number }): void;
}
