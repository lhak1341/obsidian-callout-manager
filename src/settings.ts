import { CalloutID } from '&callout';
import { CalloutSettings } from './callout-settings';
import { CALLOUT_ALIAS_GROUPS } from './callout-aliases';

/**
 * The Callout Manager plugin settings.
 */
export default interface Settings {
	callouts: {
		custom: string[];
		settings: Record<CalloutID, CalloutSettings>;
	};
	/** Maps a canonical callout ID to the list of aliases that inherit its color. */
	aliasGroups: Record<string, string[]>;
	/** Global saturation/lightness offset applied to every callout header's color, per color scheme. */
	iconColorAdjust: Record<'light' | 'dark', { saturation: number; lightness: number }>;
}

/**
 * Creates default settings for the plugin.
 */
export function defaultSettings(): Settings {
	return {
		callouts: { custom: [], settings: {} },
		aliasGroups: Object.fromEntries(
			Object.entries(CALLOUT_ALIAS_GROUPS).map(([k, v]) => [k, [...v]]),
		),
		iconColorAdjust: {
			light: { saturation: 0, lightness: 0 },
			dark: { saturation: 0, lightness: 0 },
		},
	};
}

/**
 * Migrates settings.
 *
 * @param into The object to migrate into.
 * @param from The settings to migrate from.
 * @returns The merged settings.
 */
export function migrateSettings(into: Settings, from: Settings | undefined) {
	return Object.assign(into, {
		...from,
		callouts: {
			...into.callouts,
			...(from?.callouts ?? {}),
		},
		// Preserve user's alias customisations; fall back to defaults on first run.
		aliasGroups: from?.aliasGroups ?? into.aliasGroups,
		iconColorAdjust: migrateIconColorAdjust(from?.iconColorAdjust, into.iconColorAdjust),
	});
}

/**
 * Migrates `iconColorAdjust` from its legacy flat `{ saturation, lightness }` shape (applied to
 * both color schemes alike) to the current per-scheme shape.
 */
function migrateIconColorAdjust(
	from: unknown,
	fallback: Settings['iconColorAdjust'],
): Settings['iconColorAdjust'] {
	if (from == null || typeof from !== 'object') return fallback;
	if ('light' in from && 'dark' in from) return from as Settings['iconColorAdjust'];
	if ('saturation' in from) {
		const legacy = from as { saturation: number; lightness: number };
		return { light: { ...legacy }, dark: { ...legacy } };
	}
	return fallback;
}
