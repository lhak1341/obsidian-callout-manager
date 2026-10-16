import { describe, expect, test } from '@jest/globals';

import Callout from '&callout';

import { InsertSession } from './insert-session';

const note: Callout = { id: 'note', color: '#3079b0', icon: 'pencil' };
const warning: Callout = { id: 'warning', color: '#e0a500', icon: 'alert-triangle' };
const bug: Callout = { id: 'bug', color: '#e03030', icon: 'bug' };
const callouts = [note, warning, bug];

function makeSession(options: ConstructorParameters<typeof InsertSession>[1] = {}) {
	return new InsertSession(callouts, options);
}

const DOC = ['', '', '', ''];
const at = (line: number, ch: number) => ({ from: { line, ch }, to: { line, ch } });
const START = at(3, 0);

describe('InsertSession selection and filtering', () => {
	test('starts with all callouts in id order and the first one selected', () => {
		const session = makeSession();
		expect(session.filtered.map((c) => c.id)).toEqual(['bug', 'note', 'warning']);
		expect(session.selected?.id).toBe('bug');
	});

	test('keeps the selection while it stays visible', () => {
		const session = makeSession();
		session.select('note');
		session.setQuery('no');
		expect(session.selected?.id).toBe('note');
	});

	test('moves the selection to the first match when the selected callout is filtered out', () => {
		const session = makeSession();
		session.select('note');
		session.setQuery('warn');
		expect(session.selected?.id).toBe('warning');
	});

	test('keeps the previous selection when nothing matches', () => {
		const session = makeSession();
		session.select('note');
		session.setQuery('zzz');
		expect(session.filtered).toEqual([]);
		expect(session.selected?.id).toBe('note');
	});

	test('ignores selecting an unknown id', () => {
		const session = makeSession();
		session.select('missing');
		expect(session.selected?.id).toBe('bug');
	});

	test('matches alias text when alias groups are given', () => {
		const session = makeSession({ aliasGroups: { warning: ['caution'] } });
		session.setQuery('caution');
		expect(session.filtered.map((c) => c.id)).toEqual(['warning']);
	});

	test('does not match alias text without alias groups', () => {
		const session = makeSession();
		session.setQuery('caution');
		expect(session.filtered).toEqual([]);
	});

	test('has no selection and no insertion for an empty callout list', () => {
		const session = new InsertSession([], {});
		expect(session.selected).toBeNull();
		expect(session.toInsertion(DOC, START)).toBeNull();
		expect(session.preview()).toBeNull();
	});
});

describe('InsertSession.toInsertion', () => {
	test('blank title becomes the hidden-title comment, blank body a single space', () => {
		const session = makeSession();
		session.select('note');
		expect(session.toInsertion(DOC, START)?.text).toBe('> [!note] %% %%\n>  ');
	});

	test('uses a trimmed custom title and a trimmed body', () => {
		const session = makeSession();
		session.select('note');
		session.setTitle('  Heads up ');
		session.setContent('  hello  ');
		expect(session.toInsertion(DOC, START)?.text).toBe('> [!note] Heads up\n> hello');
	});

	test('prefixes every body line with the quote marker', () => {
		const session = makeSession();
		session.select('note');
		session.setContent('one\n\nthree');
		expect(session.toInsertion(DOC, START)?.text).toBe('> [!note] %% %%\n> one\n> \n> three');
	});

	test.each([
		['', '> [!note] T\n> b'],
		['+', '> [!note]+ T\n> b'],
		['-', '> [!note]- T\n> b'],
	] as const)('fold %p', (fold, expected) => {
		const session = makeSession();
		session.select('note');
		session.setFold(fold);
		session.setTitle('T');
		session.setContent('b');
		expect(session.toInsertion(DOC, START)?.text).toBe(expected);
	});

	test('starts below the text before the cursor, separated by a blank line', () => {
		const session = makeSession();
		session.select('note');
		session.setTitle('T');
		session.setContent('b');
		expect(session.toInsertion(['', '', '', 'abcde'], at(3, 5))?.text).toBe('\n\n> [!note] T\n> b');
	});

	test('replaces the selection and keeps the rest of its line outside the callout', () => {
		const session = makeSession({ initialContent: 'cd' });
		session.select('note');
		const edit = session.toInsertion(['abcdef'], { from: { line: 0, ch: 2 }, to: { line: 0, ch: 4 } });
		expect(edit).toEqual({
			from: { line: 0, ch: 2 },
			to: { line: 0, ch: 6 },
			text: '\n\n> [!note] %% %%\n> cd\n\nef',
			cursor: { line: 3, ch: '> cd'.length },
		});
	});

	test('cursor lands at the end of the last inserted line (column start)', () => {
		const session = makeSession();
		session.select('note');
		session.setTitle('T');
		session.setContent('abc\nde');
		expect(session.toInsertion(DOC, START)?.cursor).toEqual({ line: 5, ch: '> de'.length });
	});

	test('cursor accounts for the separator lines above the callout', () => {
		const session = makeSession();
		session.select('note');
		session.setTitle('T');
		session.setContent('b');
		expect(session.toInsertion(['', '', '', 'abcde'], at(3, 5))?.cursor).toEqual({ line: 6, ch: '> b'.length });
	});
});

describe('InsertSession initial content and preview', () => {
	test('pre-fills content from the initial selection', () => {
		const session = makeSession({ initialContent: 'selected text' });
		session.select('note');
		expect(session.toInsertion(DOC, START)?.text).toBe('> [!note] %% %%\n> selected text');
	});

	test('preview of a blank title is empty, matching what the inserted markdown renders', () => {
		const session = makeSession();
		session.select('note');
		expect(session.preview()).toEqual({ id: 'note', title: '', content: undefined });
	});

	test('preview carries custom title and trimmed content', () => {
		const session = makeSession();
		session.select('note');
		session.setTitle(' T ');
		session.setContent(' body ');
		expect(session.preview()).toEqual({ id: 'note', title: 'T', content: 'body' });
	});
});
