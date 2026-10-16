import { describe, expect, test } from '@jest/globals';

import { defaultSettings, loadSettings } from './settings';

const clean = () => ({
	...defaultSettings(),
	callouts: {
		custom: ['idea', 'tip'],
		settings: {
			idea: [{ changes: { icon: 'lightbulb', color: 'var(--color-yellow)' } }],
			tip: [
				{ changes: { icon: 'rocket' } },
				{ condition: { colorScheme: 'dark' as const }, changes: { color: '251, 70, 76' } },
			],
		},
	},
});

describe('loadSettings', () => {
	test('a clean file loads unchanged, drops nothing, and does not ask to be rewritten', () => {
		const raw = clean();
		const loaded = loadSettings(raw);
		expect(loaded.dropped).toEqual([]);
		expect(loaded.changed).toBe(false);
		expect(loaded.settings.callouts).toStrictEqual(raw.callouts);
	});

	test('key order in the file is not a change', () => {
		const raw = JSON.parse(JSON.stringify(clean())) as Record<string, unknown>;
		const reordered = Object.fromEntries(Object.entries(raw).reverse());
		expect(loadSettings(reordered).changed).toBe(false);
	});

	test('missing, null and non-object input give defaults without throwing', () => {
		for (const raw of [undefined, null, 'oops', 42, [], true]) {
			const loaded = loadSettings(raw);
			expect(loaded.settings.callouts).toStrictEqual(defaultSettings().callouts);
			expect(loaded.changed).toBe(true);
		}
	});

	test('a non-object root is reported, a missing one is not', () => {
		expect(loadSettings('oops').dropped).toEqual(['<root>']);
		expect(loadSettings(undefined).dropped).toEqual([]);
	});

	test('one bad entry does not discard its valid siblings', () => {
		const raw = clean();
		raw.callouts.settings.tip.push({ changes: { icon: 'x; } body { display: none', color: 'red' } });
		const loaded = loadSettings(raw);
		expect(loaded.settings.callouts.settings.idea).toStrictEqual(raw.callouts.settings.idea);
		expect(loaded.settings.callouts.settings.tip[2]).toStrictEqual({ changes: { color: 'red' } });
		expect(loaded.dropped).toEqual(['callouts.settings.tip[2].icon']);
		expect(loaded.changed).toBe(true);
	});

	test('a non-string id no longer discards the whole custom list', () => {
		const raw = { ...clean(), callouts: { ...clean().callouts, custom: ['idea', 7, null, 'tip'] } };
		const loaded = loadSettings(raw);
		expect(loaded.settings.callouts.custom).toEqual(['idea', 'tip']);
		expect(loaded.dropped).toHaveLength(2);
	});

	test.each([
		['a quote', 'a"b'],
		['a backslash', 'a\\b'],
		['a newline', 'a\nb'],
		['a brace', 'a{b'],
		['a semicolon', 'a;b'],
		['empty', ''],
	])('an id containing %s is dropped, with its settings', (_name, id) => {
		const raw = clean();
		raw.callouts.custom.push(id);
		(raw.callouts.settings as Record<string, unknown>)[id] = [{ changes: { icon: 'x' } }];
		const loaded = loadSettings(raw);
		expect(loaded.settings.callouts.custom).not.toContain(id);
		expect(Object.keys(loaded.settings.callouts.settings)).not.toContain(id);
		expect(loaded.dropped.length).toBeGreaterThanOrEqual(2);
	});

	test('ids that isValidCalloutId rejects but are CSS-safe are kept (legacy data)', () => {
		const raw = clean();
		raw.callouts.custom.push('My_Callout');
		(raw.callouts.settings as Record<string, unknown>)['My_Callout'] = [{ changes: { icon: 'x' } }];
		const loaded = loadSettings(raw);
		expect(loaded.settings.callouts.custom).toContain('My_Callout');
		expect(loaded.dropped).toEqual([]);
	});

	test.each([
		['a semicolon', 'red; --x: y'],
		['a brace', 'red } body { x: y'],
		['an angle bracket', 'red</style>'],
		['a comment opener', 'red /* x'],
		['blank', '   '],
		['a non-string', 5],
	])('a color containing %s is removed from its setting', (_name, color) => {
		const raw = clean();
		raw.callouts.settings.idea = [{ changes: { icon: 'lightbulb', color } as never }];
		const loaded = loadSettings(raw);
		expect(loaded.settings.callouts.settings.idea).toStrictEqual([{ changes: { icon: 'lightbulb' } }]);
		expect(loaded.dropped).toEqual(['callouts.settings.idea[0].color']);
	});

	test.each(['var(--color-red)', '#4caeaa', 'rgb(1, 2, 3)', '158, 158, 158', 'color-mix(in oklch, red 10%, blue)'])(
		'the color %s is kept',
		(color) => {
			const raw = clean();
			raw.callouts.settings.idea = [{ changes: { color } }];
			expect(loadSettings(raw).dropped).toEqual([]);
		},
	);

	test.each([
		['an icon with a space', 'light bulb'],
		['an icon with a brace', 'x}'],
		['an empty icon', ''],
		['a non-string icon', 3],
	])('%s is removed from its setting', (_name, icon) => {
		const raw = clean();
		raw.callouts.settings.idea = [{ changes: { icon, color: 'red' } as never }];
		const loaded = loadSettings(raw);
		expect(loaded.settings.callouts.settings.idea).toStrictEqual([{ changes: { color: 'red' } }]);
	});

	test('plugin-registered icon ids with a colon or dot are kept', () => {
		const raw = clean();
		raw.callouts.settings.idea = [{ changes: { icon: 'remix-QuestionnaireFill' } }, { changes: { icon: 'pack:name.v2' } }];
		expect(loadSettings(raw).dropped).toEqual([]);
	});

	test.each([
		['an unknown condition key', { weather: 'rain' }],
		['a bad colorScheme', { colorScheme: 'sepia' }],
		['a non-string theme', { theme: 3 }],
		['a non-array and', { and: 'x' }],
		['a bad nested condition', { or: [{ colorScheme: 'dark' }, { nope: 1 }] }],
	])('a setting with %s is dropped whole', (_name, condition) => {
		const raw = clean();
		raw.callouts.settings.idea = [{ condition, changes: { icon: 'x' } } as never, { changes: { icon: 'y' } }];
		const loaded = loadSettings(raw);
		expect(loaded.settings.callouts.settings.idea).toStrictEqual([{ changes: { icon: 'y' } }]);
		expect(loaded.dropped).toEqual(['callouts.settings.idea[0]']);
	});

	test('valid nested conditions are kept', () => {
		const raw = clean();
		const condition = { and: [{ colorScheme: 'dark' as const }, { or: [{ theme: 'Minimal' as never }, { theme: '<default>' as const }] }] };
		raw.callouts.settings.idea = [{ condition, changes: { color: 'red' } }];
		expect(loadSettings(raw).dropped).toEqual([]);
	});

	test('a setting without a changes object is dropped', () => {
		const raw = clean();
		raw.callouts.settings.idea = [{ nope: 1 } as never, null as never, 'x' as never];
		expect(loadSettings(raw).settings.callouts.settings.idea).toEqual([]);
	});

	test('customStyles is kept verbatim when it is a string, removed when it is not', () => {
		const raw = clean();
		raw.callouts.settings.idea = [{ changes: { customStyles: '--callout-padding: 0' } }, { changes: { customStyles: 7 as never } }];
		const loaded = loadSettings(raw);
		expect(loaded.settings.callouts.settings.idea[0]).toStrictEqual({ changes: { customStyles: '--callout-padding: 0' } });
		expect(loaded.settings.callouts.settings.idea[1]).toStrictEqual({ changes: {} });
	});

	test('unknown fields on the root, on a setting, and on a setting\'s changes survive', () => {
		const raw = { ...clean(), futureField: { a: 1 } };
		raw.callouts.settings.idea = [{ future: true, changes: { icon: 'lightbulb', future: 'x' } } as never];
		const loaded = loadSettings(raw);
		expect(loaded.settings).toHaveProperty('futureField', { a: 1 });
		expect(loaded.settings.callouts.settings.idea[0]).toStrictEqual({ future: true, changes: { icon: 'lightbulb', future: 'x' } });
		expect(loaded.changed).toBe(false);
	});

	test('a malformed callouts container falls back to the default', () => {
		const loaded = loadSettings({ ...clean(), callouts: 'oops' });
		expect(loaded.settings.callouts).toStrictEqual(defaultSettings().callouts);
	});
});
