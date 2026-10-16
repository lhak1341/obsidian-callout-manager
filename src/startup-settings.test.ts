import { describe, expect, test } from '@jest/globals';

import { defaultSettings } from './settings';
import { auxiliaryFiles, resolveStartup } from './startup-settings';

const file = () => ({
	...defaultSettings(),
	callouts: { custom: ['idea'], settings: { idea: [{ changes: { icon: 'lightbulb' } }] } },
});

describe('resolveStartup', () => {
	test('a clean file is used as it is and is not rewritten', () => {
		const startup = resolveStartup(file(), null);
		expect(startup).toMatchObject({ source: 'file', save: false, dropped: [] });
		expect(startup.settings.callouts.custom).toEqual(['idea']);
	});

	test('a missing file with a backup restores the backup and writes it back', () => {
		const startup = resolveStartup(null, file());
		expect(startup).toMatchObject({ source: 'backup', save: true });
		expect(startup.settings.callouts.custom).toEqual(['idea']);
	});

	test('undefined counts as missing', () => {
		expect(resolveStartup(undefined, file()).source).toBe('backup');
	});

	test('a missing file with no usable backup starts from defaults and saves them', () => {
		for (const backup of [null, undefined, 'oops', [], 7]) {
			expect(resolveStartup(null, backup)).toMatchObject({ source: 'defaults', save: true });
		}
	});

	test('a present file wins over the backup, even a damaged one', () => {
		const startup = resolveStartup({ ...file(), callouts: { custom: ['idea', 'a"b'], settings: {} } }, { ...file(), callouts: { custom: ['old'], settings: {} } });
		expect(startup.source).toBe('file');
		expect(startup.settings.callouts.custom).toEqual(['idea']);
		expect(startup.save).toBe(true);
	});

	test('a non-object file is not replaced by the backup, and is reported', () => {
		const startup = resolveStartup('oops', file());
		expect(startup).toMatchObject({ source: 'file', save: true, dropped: ['<root>'] });
	});
});

describe('auxiliaryFiles', () => {
	test('a clean file becomes the backup when it differs from it', () => {
		const raw = file();
		const files = auxiliaryFiles(resolveStartup(raw, null), raw, null);
		expect(files.backup).toBeDefined();
		expect(JSON.parse(files.backup ?? '')).toStrictEqual(raw);
		expect(files.quarantine).toBeUndefined();
	});

	test('nothing is written when the backup already matches', () => {
		const raw = file();
		const text = JSON.stringify(raw, null, '\t');
		expect(auxiliaryFiles(resolveStartup(raw, null), raw, text)).toEqual({});
	});

	test('a file that lost entries is quarantined whole and does not replace the backup', () => {
		const raw = { ...file(), callouts: { custom: ['idea', 'a"b'], settings: {} } };
		const files = auxiliaryFiles(resolveStartup(raw, null), raw, 'previous');
		expect(JSON.parse(files.quarantine ?? '')).toStrictEqual(raw);
		expect(files.backup).toBeUndefined();
	});

	test('a restored or defaulted start writes no side file', () => {
		expect(auxiliaryFiles(resolveStartup(null, file()), null, 'x')).toEqual({});
		expect(auxiliaryFiles(resolveStartup(null, null), null, null)).toEqual({});
	});
});
