import { App } from 'obsidian';

import { Callout, CalloutID } from '&callout';
import { CalloutSettings } from './callout-settings';

export interface CalloutReader {
	readonly app: App;

	getCallouts(): Callout[];
	hasCallout(id: CalloutID): boolean;

	getCalloutSettings(id: CalloutID): CalloutSettings | undefined;
}

/** Tells consumers once per change to callouts or their styles; they re-read via {@link CalloutReader}. */
export interface CalloutChangeSource {
	/** @returns A function that removes the listener. */
	subscribe(listener: () => void): () => void;
}

export interface AliasReader {
	getAliasGroups(): Record<string, string[]>;
}

export interface AliasStore extends AliasReader {
	setAliasGroup(canonical: string, aliases: string[]): void;
}

/** Global saturation/lightness offset applied to every callout header's color, for one color scheme. */
export type IconColorAdjust = { saturation: number; lightness: number };

/**
 * Bounds of the saturation/lightness offsets. The settings sliders use them as their range and the
 * stylesheet clamps to them, so a hand-edited `data.json` can't push `hsl(from ...)` out of gamut.
 */
export const ICON_COLOR_ADJUST_LIMITS = {
	saturation: { min: -100, max: 100, step: 5 },
	lightness: { min: -50, max: 50, step: 5 },
} as const;

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
