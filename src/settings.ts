import { CalloutID } from '&callout';
import { CalloutSettings } from './callout-settings';
import { CALLOUT_ALIAS_GROUPS } from './callout-aliases';
import { IconColorAdjust } from './callout-store';
import { isPlainObject, isSafeStoredCalloutId, sanitizeCalloutSettings } from './settings-validate';

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
 * @param dropped Collects a description of every stored entry that was discarded as invalid.
 * @returns The merged settings.
 */
export function migrateSettings(into: Settings, from: Settings | undefined, dropped: string[] = []) {
	return Object.assign(into, {
		...from,
		callouts: migrateCallouts(from?.callouts, into.callouts, dropped),
		// Preserve user's alias customisations; fall back to defaults on first run or bad data.
		aliasGroups: migrateAliasGroups(from?.aliasGroups, into.aliasGroups),
		iconColorAdjust: migrateIconColorAdjust(from?.iconColorAdjust, into.iconColorAdjust),
	});
}

export interface LoadedSettings {
	settings: Settings;
	/** Whether the result differs from `raw`, i.e. whether writing it back would change the file. */
	changed: boolean;
	/** What was discarded as invalid, e.g. `callouts.settings.note[1].color`; empty for a clean file. */
	dropped: string[];
}

/** Key-order-independent JSON, so `changed` reflects content and not how the file happened to be written. */
function stableJson(value: unknown): string {
	return JSON.stringify(value, (_key, v: unknown) =>
		isPlainObject(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) : v,
	);
}

/**
 * Turns whatever `loadData()` returned into settings, never throwing. Invalid entries are dropped
 * one at a time (a bad entry must not discard its siblings) and reported in `dropped`.
 */
export function loadSettings(raw: unknown): LoadedSettings {
	const dropped: string[] = [];
	let from: unknown = raw;
	if (raw != null && !isPlainObject(raw)) {
		dropped.push('<root>');
		from = undefined;
	}

	// `migrateSettings` reads only the fields it validates; the object itself is unchecked input here.
	const settings = migrateSettings(defaultSettings(), isPlainObject(from) ? (from as unknown as Settings) : undefined, dropped);
	return { settings, changed: stableJson(raw) !== stableJson(settings), dropped };
}

/**
 * Validates persisted `callouts`. A malformed container falls back to `fallback`. Inside a valid
 * one every id and every setting is checked on its own, so one bad entry can't discard (or crash
 * on) its valid siblings; see `settings-validate.ts` for what counts as bad.
 */
function migrateCallouts(from: unknown, fallback: Settings['callouts'], dropped: string[]): Settings['callouts'] {
	if (!isPlainObject(from)) return fallback;
	const { custom, settings } = from;

	const keptCustom: string[] = [];
	if (Array.isArray(custom)) {
		for (const id of custom) {
			if (isSafeStoredCalloutId(id)) keptCustom.push(id);
			else dropped.push(`callouts.custom[${JSON.stringify(id)}]`);
		}
	}

	const keptSettings: Settings['callouts']['settings'] = {};
	if (isPlainObject(settings)) {
		for (const [id, entries] of Object.entries(settings)) {
			if (!isSafeStoredCalloutId(id) || !Array.isArray(entries)) {
				dropped.push(`callouts.settings.${id}`);
				continue;
			}
			keptSettings[id] = sanitizeCalloutSettings(id, entries, dropped);
		}
	}

	return {
		custom: Array.isArray(custom) ? keptCustom : fallback.custom,
		settings: isPlainObject(settings) ? keptSettings : fallback.settings,
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
