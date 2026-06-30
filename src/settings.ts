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
	});
}
