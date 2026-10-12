import { describe, expect, jest, test } from '@jest/globals';

import Callout from '&callout';

import type { CalloutSettings } from './callout-settings';
import { CalloutRowStore, RowSession } from './row-session';

const note: Callout = { id: 'note', color: '#3079b0', icon: 'pencil' };

function makeStore(init: { settings?: CalloutSettings; aliases?: string[]; existing?: string[] } = {}) {
	const existing = new Set(init.existing ?? ['note']);
	const store = {
		app: {} as CalloutRowStore['app'],
		getCallouts: jest.fn(() => []),
		hasCallout: jest.fn((id: string) => existing.has(id)),
		getCalloutSettings: jest.fn(() => init.settings),
		getAliasGroups: jest.fn(() => (init.aliases ? { note: init.aliases } : {})),
		setAliasGroup: jest.fn(),
		setCalloutSettings: jest.fn(),
		renameCustomCallout: jest.fn(),
		removeCustomCallout: jest.fn(),
	};
	return store;
}

describe('RowSession appearance draft', () => {
	test('starts empty when the callout has no saved settings', () => {
		const row = new RowSession(note, makeStore());
		expect(row.isComplex).toBe(false);
		expect(row.color).toBe('');
		expect(row.icon).toBe('');
	});

	test('reads color and icon from a unified saved setting', () => {
		const row = new RowSession(note, makeStore({ settings: [{ changes: { color: 'red', icon: 'bug' } }] }));
		expect(row.color).toBe('red');
		expect(row.icon).toBe('bug');
	});

	test('setColor saves color together with the existing icon', () => {
		const store = makeStore({ settings: [{ changes: { icon: 'bug' } }] });
		const row = new RowSession(note, store);
		row.setColor('blue');
		expect(store.setCalloutSettings).toHaveBeenCalledWith('note', [{ changes: { color: 'blue', icon: 'bug' } }]);
	});

	test('clearing both color and icon saves an empty settings list', () => {
		const store = makeStore({ settings: [{ changes: { color: 'red' } }] });
		const row = new RowSession(note, store);
		row.setColor('');
		expect(store.setCalloutSettings).toHaveBeenCalledWith('note', []);
	});

	test('a conditional setting is complex and refuses edits', () => {
		const store = makeStore({ settings: [{ condition: { colorScheme: 'dark' }, changes: { color: 'red' } }] });
		const row = new RowSession(note, store);
		expect(row.isComplex).toBe(true);
		row.setColor('blue');
		row.setIcon('bug');
		expect(store.setCalloutSettings).not.toHaveBeenCalled();
	});

	test('a customStyles change makes the row complex', () => {
		const row = new RowSession(note, makeStore({ settings: [{ changes: { customStyles: 'x: y' } }] }));
		expect(row.isComplex).toBe(true);
	});
});

describe('RowSession aliases', () => {
	test('addAlias normalizes, saves and reports a row change', () => {
		const store = makeStore({ aliases: ['a'] });
		const row = new RowSession(note, store);
		expect(row.addAlias('  B ')).toEqual({ ok: true, changed: 'row' });
		expect(store.setAliasGroup).toHaveBeenCalledWith('note', ['a', 'b']);
		expect(row.aliases).toEqual(['a', 'b']);
	});

	test.each([
		['blank', '   ', 'empty'],
		['duplicate', 'a', 'exists'],
		['itself', 'note', 'invalid'],
		['bad shape', '2fast', 'invalid'],
	])('addAlias rejects %s without saving', (_name, input, reason) => {
		const store = makeStore({ aliases: ['a'] });
		const row = new RowSession(note, store);
		const result = row.addAlias(input);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.reason).toBe(reason);
		expect(store.setAliasGroup).not.toHaveBeenCalled();
		expect(row.aliases).toEqual(['a']);
	});

	test('removeAlias saves the shorter list', () => {
		const store = makeStore({ aliases: ['a', 'b'] });
		const row = new RowSession(note, store);
		expect(row.removeAlias('a').ok).toBe(true);
		expect(store.setAliasGroup).toHaveBeenCalledWith('note', ['b']);
		expect(row.aliases).toEqual(['b']);
	});

	test('an alias edit asks for a list rebuild while a filter is active', () => {
		const row = new RowSession(note, makeStore(), () => true);
		expect(row.addAlias('x')).toEqual({ ok: true, changed: 'list' });
	});

	test('a store throw is returned and leaves the alias list unchanged', () => {
		const store = makeStore();
		store.setAliasGroup.mockImplementation(() => {
			throw new Error('boom');
		});
		const row = new RowSession(note, store);
		expect(row.addAlias('x')).toEqual({ ok: false, reason: 'failed', message: 'boom' });
		expect(row.aliases).toEqual([]);
	});
});

describe('RowSession rename and remove', () => {
	test('rename slugifies and renames, asking for a list rebuild', () => {
		const store = makeStore();
		const row = new RowSession(note, store);
		expect(row.rename(' My Note ')).toEqual({ ok: true, changed: 'list' });
		expect(store.renameCustomCallout).toHaveBeenCalledWith('note', 'my-note');
	});

	test('rename to the same id is unchanged and does not touch the store', () => {
		const store = makeStore();
		const result = new RowSession(note, store).rename('Note');
		expect(result).toMatchObject({ ok: false, reason: 'unchanged' });
		expect(store.renameCustomCallout).not.toHaveBeenCalled();
	});

	test('rename onto an existing id is refused', () => {
		const store = makeStore({ existing: ['note', 'bug'] });
		const result = new RowSession(note, store).rename('bug');
		expect(result).toMatchObject({ ok: false, reason: 'exists' });
		expect(store.renameCustomCallout).not.toHaveBeenCalled();
	});

	test('rename to an invalid id is refused with the id message', () => {
		const result = new RowSession(note, makeStore()).rename('2fast');
		expect(result).toMatchObject({ ok: false, reason: 'invalid' });
	});

	test('remove calls the store and asks for a list rebuild', () => {
		const store = makeStore();
		expect(new RowSession(note, store).remove()).toEqual({ ok: true, changed: 'list' });
		expect(store.removeCustomCallout).toHaveBeenCalledWith('note');
	});
});
