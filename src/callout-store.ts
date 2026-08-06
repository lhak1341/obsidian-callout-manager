import { App } from 'obsidian';

import { Callout, CalloutID } from '&callout';
import { CalloutSettings } from './callout-settings';

export interface CalloutReader {
	readonly app: App;

	getCallouts(): Callout[];
	hasCallout(id: CalloutID): boolean;

	getCalloutSettings(id: CalloutID): CalloutSettings | undefined;
}

export interface AliasStore {
	getAliasGroups(): Record<string, string[]>;
	setAliasGroup(canonical: string, aliases: string[]): void;
}

/** Global saturation/lightness offset applied to every callout header's color, for one color scheme. */
export type IconColorAdjust = { saturation: number; lightness: number };

export interface IconColorAdjustStore {
	getIconColorAdjust(scheme: 'light' | 'dark'): IconColorAdjust;
	setIconColorAdjust(scheme: 'light' | 'dark', adjust: IconColorAdjust): void;
}

/**
 * The full callout write surface. Only `ManageCalloutsPane` needs this — other consumers should
 * depend on `CalloutReader`, `AliasStore`, or `IconColorAdjustStore` directly rather than widening
 * back to this out of habit.
 */
export interface CalloutStore extends CalloutReader, AliasStore, IconColorAdjustStore {
	setCalloutSettings(id: CalloutID, settings: CalloutSettings | undefined): void;

	createCustomCallout(id: CalloutID): void;
	renameCustomCallout(oldId: CalloutID, newId: CalloutID): void;
	removeCustomCallout(id: CalloutID): void;
}
