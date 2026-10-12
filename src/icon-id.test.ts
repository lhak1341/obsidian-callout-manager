import { describe, expect, test } from '@jest/globals';

import { DEFAULT_ICON_ID, IconRegistry, resolveIconId, resolveIconIdOrDefault } from './icon-id';

function makeRegistry(native: string[], gap: string[]): IconRegistry {
	return { native: new Set(native), gap: new Set(gap) };
}

const registry = makeRegistry(['flame', 'pencil', 'both'], ['gapped', 'both']);

describe('resolveIconId', () => {
	test('a bare native name gets the native prefix', () => {
		expect(resolveIconId('flame', registry)).toBe('lucide-flame');
	});

	test('an already-prefixed native id stays as it is', () => {
		expect(resolveIconId('lucide-flame', registry)).toBe('lucide-flame');
	});

	test('a gap-filled icon resolves to the plugin prefix, from bare or prefixed form', () => {
		expect(resolveIconId('gapped', registry)).toBe('callout-manager-lucide-gapped');
		expect(resolveIconId('lucide-gapped', registry)).toBe('callout-manager-lucide-gapped');
	});

	test('native wins when an icon is in both sets', () => {
		expect(resolveIconId('both', registry)).toBe('lucide-both');
	});

	test('an unknown id passes through unchanged, prefixed or not', () => {
		expect(resolveIconId('nonesuch', registry)).toBe('nonesuch');
		expect(resolveIconId('lucide-nonesuch', registry)).toBe('lucide-nonesuch');
	});

	test('an empty id stays empty', () => {
		expect(resolveIconId('', registry)).toBe('');
	});

	test('an empty registry leaves every id unchanged', () => {
		expect(resolveIconId('flame', makeRegistry([], []))).toBe('flame');
	});
});

describe('resolveIconIdOrDefault', () => {
	test.each([[undefined], ['']])('%p falls back to the default icon', (id) => {
		expect(resolveIconIdOrDefault(id, registry)).toBe(resolveIconId(DEFAULT_ICON_ID, registry));
	});

	test('the default is itself resolved against the registry', () => {
		expect(resolveIconIdOrDefault('', makeRegistry(['pencil'], []))).toBe('lucide-pencil');
	});

	test('a non-empty id resolves normally', () => {
		expect(resolveIconIdOrDefault('gapped', registry)).toBe('callout-manager-lucide-gapped');
	});
});
