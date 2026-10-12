import { describe, expect, jest, test } from '@jest/globals';

import Callout from '&callout';

import { ManageSession, ManageStore } from './manage-session';

const note: Callout = { id: 'note', color: '#3079b0', icon: 'pencil' };
const warning: Callout = { id: 'warning', color: '#e0a500', icon: 'alert' };
const bug: Callout = { id: 'bug', color: '#e03030', icon: 'bug' };

function makeStore(callouts: Callout[] = [note, warning, bug], aliasGroups: Record<string, string[]> = {}) {
	const store = {
		app: {} as ManageStore['app'],
		getCallouts: jest.fn(() => callouts),
		hasCallout: jest.fn((id: string) => callouts.some((c) => c.id === id)),
		getCalloutSettings: jest.fn(() => undefined),
		getAliasGroups: jest.fn(() => aliasGroups),
		setAliasGroup: jest.fn(),
		setCalloutSettings: jest.fn(),
		renameCustomCallout: jest.fn(),
		removeCustomCallout: jest.fn(),
		createCustomCallout: jest.fn((id: string) => {
			callouts.push({ id, color: '', icon: '' });
		}),
	};
	return store;
}

function makeSession(...args: Parameters<typeof makeStore>) {
	const store = makeStore(...args);
	const session = new ManageSession(store);
	session.reload();
	return { session, store };
}

const ids = (s: ManageSession) => s.visible.map((c) => c.id);

describe('ManageSession list state', () => {
	test('shows all callouts in id order after reload', () => {
		expect(ids(makeSession().session)).toEqual(['bug', 'note', 'warning']);
	});

	test('setQuery filters, including by alias text', () => {
		const { session } = makeSession(undefined, { note: ['memo'] });
		session.setQuery('memo');
		expect(ids(session)).toEqual(['note']);
	});

	test('cycleSort goes name → color → icon → name and re-sorts', () => {
		const { session } = makeSession();
		expect(session.cycleSort()).toBe('color');
		expect(ids(session)).toEqual(['bug', 'warning', 'note'].sort((a, b) => colorOf(a).localeCompare(colorOf(b))));
		expect(session.cycleSort()).toBe('icon');
		expect(session.cycleSort()).toBe('name');
	});

	test('startCreating and cancelCreating toggle the create row', () => {
		const { session } = makeSession();
		session.startCreating();
		expect(session.isCreating).toBe(true);
		session.cancelCreating();
		expect(session.isCreating).toBe(false);
	});
});

function colorOf(id: string): string {
	return [note, warning, bug].find((c) => c.id === id)!.color;
}

describe('ManageSession create', () => {
	test('slugifies, creates, closes the create row and reloads', () => {
		const { session, store } = makeSession();
		session.startCreating();
		expect(session.create('My Callout')).toEqual({ ok: true, changed: 'list' });
		expect(store.createCustomCallout).toHaveBeenCalledWith('my-callout');
		expect(session.isCreating).toBe(false);
		expect(ids(session)).toContain('my-callout');
	});

	test('a duplicate id is refused here, since the repository would accept it', () => {
		const { session, store } = makeSession();
		session.startCreating();
		const result = session.create('note');
		expect(result).toMatchObject({ ok: false, reason: 'exists' });
		expect(store.createCustomCallout).not.toHaveBeenCalled();
		expect(session.isCreating).toBe(true);
	});

	test('blank input is empty with no message; bad shape is invalid', () => {
		const { session, store } = makeSession();
		expect(session.create('  ')).toMatchObject({ ok: false, reason: 'empty', message: '' });
		expect(session.create('2fast')).toMatchObject({ ok: false, reason: 'invalid' });
		expect(store.createCustomCallout).not.toHaveBeenCalled();
	});

	test('a store throw is returned and keeps the create row open', () => {
		const { session, store } = makeSession();
		store.createCustomCallout.mockImplementation(() => {
			throw new Error('boom');
		});
		session.startCreating();
		expect(session.create('fresh')).toEqual({ ok: false, reason: 'failed', message: 'boom' });
		expect(session.isCreating).toBe(true);
	});
});

describe('ManageSession rowFor', () => {
	test('row alias edits ask for a list rebuild only while a query is active', () => {
		const { session } = makeSession();
		expect(session.rowFor(note).addAlias('a')).toEqual({ ok: true, changed: 'row' });
		session.setQuery('no');
		expect(session.rowFor(note).addAlias('b')).toEqual({ ok: true, changed: 'list' });
	});
});
