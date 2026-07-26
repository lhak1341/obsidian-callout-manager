import { describe, expect, test } from '@jest/globals';

import { defaultSettings, migrateIconColorAdjust, migrateSettings } from './settings';

const fallback = { light: { saturation: 0, lightness: 0 }, dark: { saturation: 0, lightness: 0 } };

describe('migrateIconColorAdjust', () => {
	test('current per-scheme shape passes through', () => {
		const current = { light: { saturation: 10, lightness: -5 }, dark: { saturation: -10, lightness: 5 } };
		expect(migrateIconColorAdjust(current, fallback)).toStrictEqual(current);
	});

	test('legacy flat {saturation, lightness} shape migrates to both schemes', () => {
		const legacy = { saturation: 15, lightness: 20 };
		expect(migrateIconColorAdjust(legacy, fallback)).toStrictEqual({
			light: { saturation: 15, lightness: 20 },
			dark: { saturation: 15, lightness: 20 },
		});
	});

	test('unrecognized shape falls back to defaults', () => {
		expect(migrateIconColorAdjust(undefined, fallback)).toStrictEqual(fallback);
		expect(migrateIconColorAdjust(null, fallback)).toStrictEqual(fallback);
		expect(migrateIconColorAdjust('nonsense', fallback)).toStrictEqual(fallback);
		expect(migrateIconColorAdjust(42, fallback)).toStrictEqual(fallback);
		expect(migrateIconColorAdjust({}, fallback)).toStrictEqual(fallback);
		expect(migrateIconColorAdjust({ foo: 'bar' }, fallback)).toStrictEqual(fallback);
	});

	test('light/dark keys present but not {saturation, lightness} numbers falls back', () => {
		expect(migrateIconColorAdjust({ light: 'oops', dark: 'oops' }, fallback)).toStrictEqual(fallback);
		expect(
			migrateIconColorAdjust({ light: { saturation: '10', lightness: 0 }, dark: {} }, fallback),
		).toStrictEqual(fallback);
	});

	test('legacy saturation key present but not a number falls back', () => {
		expect(migrateIconColorAdjust({ saturation: '15', lightness: 20 }, fallback)).toStrictEqual(fallback);
	});
});

describe('migrateSettings', () => {
	test('first run (from undefined) keeps defaults', () => {
		const result = migrateSettings(defaultSettings(), undefined);
		expect(result.iconColorAdjust).toStrictEqual(fallback);
	});

	test('wires a valid persisted iconColorAdjust through unchanged', () => {
		const persisted = defaultSettings();
		persisted.iconColorAdjust = { light: { saturation: 30, lightness: -10 }, dark: { saturation: -30, lightness: 10 } };
		const result = migrateSettings(defaultSettings(), persisted);
		expect(result.iconColorAdjust).toStrictEqual(persisted.iconColorAdjust);
	});

	test('a corrupted persisted iconColorAdjust falls back to defaults instead of crashing', () => {
		const persisted = defaultSettings();
		(persisted as unknown as { iconColorAdjust: unknown }).iconColorAdjust = { light: 'oops', dark: 'oops' };
		const result = migrateSettings(defaultSettings(), persisted);
		expect(result.iconColorAdjust).toStrictEqual(fallback);
	});
});
