import { CalloutID } from '&callout';
import { CalloutSettings } from './callout-settings';
import { CALLOUT_ALIAS_GROUPS } from './callout-aliases';
import { IconColorAdjust } from './callout-store';

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
	iconColorAdjust: Record<'light' | 'dark', IconColorAdjust>;
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
		callouts: migrateCallouts(from?.callouts, into.callouts),
		// Preserve user's alias customisations; fall back to defaults on first run or bad data.
		aliasGroups: migrateAliasGroups(from?.aliasGroups, into.aliasGroups),
		iconColorAdjust: migrateIconColorAdjust(from?.iconColorAdjust, into.iconColorAdjust),
	});
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return value != null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Validates persisted `callouts`. A malformed container falls back to `fallback`; within a valid
 * `settings` object, entries that aren't arrays are dropped so one bad entry can't discard (or
 * crash on) its valid siblings.
 */
function migrateCallouts(from: unknown, fallback: Settings['callouts']): Settings['callouts'] {
	if (!isPlainObject(from)) return fallback;
	const { custom, settings } = from;
	return {
		custom: Array.isArray(custom) && custom.every((c) => typeof c === 'string') ? [...custom] : fallback.custom,
		settings: isPlainObject(settings)
			? (Object.fromEntries(Object.entries(settings).filter(([, v]) => Array.isArray(v))) as Settings['callouts']['settings'])
			: fallback.settings,
	};
}

/** Validates persisted `aliasGroups`; a malformed container falls back, malformed entries are dropped. */
function migrateAliasGroups(from: unknown, fallback: Settings['aliasGroups']): Settings['aliasGroups'] {
	if (!isPlainObject(from)) return fallback;
	return Object.fromEntries(
		Object.entries(from).filter(
			([, v]) => Array.isArray(v) && v.every((a) => typeof a === 'string'),
		),
	) as Settings['aliasGroups'];
}

function isValidSchemeAdjust(value: unknown): value is IconColorAdjust {
	return (
		value != null &&
		typeof value === 'object' &&
		typeof (value as IconColorAdjust).saturation === 'number' &&
		typeof (value as IconColorAdjust).lightness === 'number'
	);
}

/**
 * Migrates `iconColorAdjust` from its legacy flat `{ saturation, lightness }` shape (applied to
 * both color schemes alike) to the current per-scheme shape.
 *
 * Falls back to `fallback` (discarding the persisted value) if `from` doesn't match either the
 * current or legacy shape, or if it matches but its saturation/lightness aren't actually numbers.
 */
export function migrateIconColorAdjust(
	from: unknown,
	fallback: Settings['iconColorAdjust'],
): Settings['iconColorAdjust'] {
	if (from == null || typeof from !== 'object') return fallback;

	if ('light' in from && 'dark' in from) {
		const { light, dark } = from as { light: unknown; dark: unknown };
		if (isValidSchemeAdjust(light) && isValidSchemeAdjust(dark)) {
			return { light: { ...light }, dark: { ...dark } };
		}
		return fallback;
	}

	if ('saturation' in from && isValidSchemeAdjust(from)) {
		return { light: { ...from }, dark: { ...from } };
	}

	return fallback;
}
