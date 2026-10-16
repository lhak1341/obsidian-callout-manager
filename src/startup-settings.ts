import { isPlainObject } from './settings-validate';
import { loadSettings, type LoadedSettings } from './settings';

/** Where the settings a session starts with came from. */
export type SettingsSource = 'file' | 'backup' | 'defaults';

export interface StartupSettings extends LoadedSettings {
	source: SettingsSource;
	/** Whether the settings file should be (re)written now. Only when doing so changes or restores it. */
	save: boolean;
}

/**
 * Decides what the plugin starts with, given what `loadData()` returned and the last known-good
 * copy kept beside it (`null` when there is none).
 *
 * A missing `data.json` is ambiguous: a first run, or a synced file that has not arrived yet.
 * Falling straight through to defaults and saving them is how the second case overwrites the
 * user's real settings, so a backup, when one exists, wins over an empty file. A file that is
 * present is always preferred, even a damaged one: its valid entries are kept.
 */
export function resolveStartup(raw: unknown, backup: unknown): StartupSettings {
	if (raw == null && isPlainObject(backup)) {
		const loaded = loadSettings(backup);
		return { ...loaded, source: 'backup', save: true };
	}

	const loaded = loadSettings(raw);
	if (raw == null) return { ...loaded, source: 'defaults', save: true };
	// A non-object file is reported as `<root>` and replaced; otherwise only a real change rewrites.
	return { ...loaded, source: 'file', save: loaded.changed };
}

export interface AuxiliaryFiles {
	/** Text for `data.quarantine.json`: the file as it was before invalid entries were dropped. */
	quarantine?: string;
	/** Text for `data.backup.json`: the last known-good copy of the file. */
	backup?: string;
}

const pretty = (value: unknown): string => JSON.stringify(value, null, '\t');

/**
 * Which side files to write after a start. A file that lost entries is kept whole as the
 * quarantine copy and does not become the backup (the backup must stay a file that loaded clean).
 * A clean file becomes the backup when it differs from it.
 *
 * @param existingBackup The text currently in `data.backup.json`, or `null` when there is none.
 */
export function auxiliaryFiles(startup: StartupSettings, raw: unknown, existingBackup: string | null): AuxiliaryFiles {
	if (startup.dropped.length > 0) return raw == null ? {} : { quarantine: pretty(raw) };
	if (startup.source === 'file' && isPlainObject(raw)) {
		const text = pretty(raw);
		return text === existingBackup ? {} : { backup: text };
	}
	return {};
}
