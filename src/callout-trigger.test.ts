import { describe, expect, test } from '@jest/globals';

import type Callout from '&callout';

import { type Trigger, choicesFor, planPick, readTrigger } from './callout-trigger';

const doc = (source: string) => source.split('\n');

/** The id under a `|` cursor in a one-line document, or null. */
function trigger(source: string, lines: readonly string[] = []): Trigger | null {
	const all = [...lines, source];
	const last = all.length - 1;
	const ch = (all[last] ?? '').indexOf('|');
	all[last] = (all[last] ?? '').replace('|', '');
	return readTrigger(all, last, ch);
}

describe('readTrigger', () => {
	test('opens on a callout header being typed', () => {
		expect(trigger('> [!no|')).toEqual({ line: 0, idStart: 4, idEnd: 6, id: 'no', lead: '> ' });
		expect(trigger('> [!|')).toMatchObject({ id: '', idStart: 4, idEnd: 4 });
	});

	test('the id is the whole word, wherever the cursor sits inside it', () => {
		expect(trigger('> [!n|ote]')).toMatchObject({ id: 'note', idStart: 4, idEnd: 8 });
		expect(trigger('> [!note|]')).toMatchObject({ id: 'note' });
		expect(trigger('> [!|note]')).toMatchObject({ id: 'note' });
	});

	test('works at every quote depth and without the space after the marker', () => {
		expect(trigger('> > [!ti|')).toMatchObject({ id: 'ti', lead: '> > ' });
		expect(trigger('>[!ti|')).toMatchObject({ id: 'ti', lead: '>' });
	});

	test('stays closed outside a callout header', () => {
		expect(trigger('[!no|')).toBeNull();
		expect(trigger('text [!no|')).toBeNull();
		expect(trigger('> text [!no|')).toBeNull();
		expect(trigger('- [!no|')).toBeNull();
		expect(trigger('> ab|')).toBeNull();
		expect(trigger('> [|')).toBeNull();
		expect(trigger('> !|')).toBeNull();
	});

	test('stays closed once the cursor is past the id', () => {
		expect(trigger('> [!note]| title')).toBeNull();
		expect(trigger('> [!note|purple]'.replace('|', '') + '|')).toBeNull();
		expect(trigger('> [!note]+ ti|tle')).toBeNull();
	});

	test('stays closed with the cursor before the opening bracket', () => {
		expect(trigger('|> [!note]')).toBeNull();
		expect(trigger('> |[!note]')).toBeNull();
		expect(trigger('> [|!note]')).toBeNull();
	});

	test('stays closed inside the properties', () => {
		expect(readTrigger(['---', '> [!no', '---'], 1, 6)).toBeNull();
		expect(readTrigger(['---', 'a: 1', '---', '> [!no'], 3, 6)).not.toBeNull();
		// A first line of --- that is never closed is not properties.
		expect(readTrigger(['---', '> [!no'], 1, 6)).not.toBeNull();
	});

	test('stays closed inside a fenced code block, and reopens after it', () => {
		expect(trigger('> [!no|', ['```md'])).toBeNull();
		expect(trigger('> [!no|', ['~~~', 'x'])).toBeNull();
		expect(trigger('> [!no|', ['```', 'x', '```'])).not.toBeNull();
		expect(trigger('> [!no|', ['> ```', '> x'])).toBeNull();
	});

	test('a longer fence is not closed by a shorter one, nor by a different character', () => {
		expect(trigger('> [!no|', ['````', '```'])).toBeNull();
		expect(trigger('> [!no|', ['```', '~~~'])).toBeNull();
		expect(trigger('> [!no|', ['```', '```js'])).toBeNull();
	});

	test('a line number out of range gives nothing', () => {
		expect(readTrigger(doc('a'), 5, 0)).toBeNull();
	});
});

const callouts: Callout[] = [
	{ id: 'note', color: '#000', icon: 'pencil' },
	{ id: 'tip', color: '#000', icon: 'flame' },
];
const aliases = { tip: ['hint'] };

describe('choicesFor', () => {
	test('lists matching callouts by id', () => {
		expect(choicesFor(callouts, aliases, 'not').map((c) => (c.kind === 'callout' ? c.callout.id : c.id))).toEqual(['note', 'not']);
		expect(choicesFor(callouts, aliases, 'flame')).toEqual([{ kind: 'create', id: 'flame' }]);
	});

	test('an empty query lists everything and offers nothing to create', () => {
		const choices = choicesFor(callouts, aliases, '');
		expect(choices).toHaveLength(2);
		expect(choices.every((c) => c.kind === 'callout')).toBe(true);
	});

	test('offers to create an unknown id, last, in id form', () => {
		expect(choicesFor(callouts, aliases, 'No Te')).toEqual([{ kind: 'create', id: 'no-te' }]);
		expect(choicesFor(callouts, aliases, 'not')).toEqual([
			{ kind: 'callout', callout: callouts[0] },
			{ kind: 'create', id: 'not' },
		]);
	});

	test('does not offer to create an id that exists or is an alias', () => {
		expect(choicesFor(callouts, aliases, 'note').some((c) => c.kind === 'create')).toBe(false);
		expect(choicesFor(callouts, aliases, 'hint').some((c) => c.kind === 'create')).toBe(false);
	});

	test('does not offer to create an invalid id', () => {
		expect(choicesFor(callouts, aliases, '9lives').some((c) => c.kind === 'create')).toBe(false);
	});
});

/** `¦` marks the cursor before the pick and, in the result, after it. */
function pick(source: string, id: string, following: string[] = []) {
	const lines = [source.replace('¦', ''), ...following];
	const t = readTrigger(lines, 0, source.indexOf('¦'));
	if (!t) throw new Error('no trigger');
	const edit = planPick(lines, t, id);
	const flat = (p: { line: number; ch: number }) => lines.slice(0, p.line).reduce((n, l) => n + l.length + 1, 0) + p.ch;
	const all = lines.join('\n');
	const after = all.slice(0, flat(edit.from)) + edit.text + all.slice(flat(edit.to));
	const cursorLines = after.split('\n');
	const cursorFlat = cursorLines.slice(0, edit.cursor.line).reduce((n, l) => n + l.length + 1, 0) + edit.cursor.ch;
	return after.slice(0, cursorFlat) + '¦' + after.slice(cursorFlat);
}

describe('planPick', () => {
	test('writes the id and the closing bracket and opens a quoted line below', () => {
		expect(pick('> [!no¦', 'note')).toBe('> [!note]\n> ¦');
	});

	test('keeps an existing closing bracket and does not double it', () => {
		expect(pick('> [!no¦]', 'note')).toBe('> [!note]\n> ¦');
	});

	test('replaces the whole typed id, not just the part before the cursor', () => {
		expect(pick('> [!n¦ote]', 'tip')).toBe('> [!tip]\n> ¦');
	});

	test('keeps the fold marker and an existing title, and ends the cursor at the header', () => {
		expect(pick('> [!no¦]- Title', 'note')).toBe('> [!note]- Title¦');
	});

	test('a fold marker alone is not a title', () => {
		expect(pick('> [!no¦]+', 'note')).toBe('> [!note]+\n> ¦');
	});

	test('does not open a new line when a body already follows', () => {
		expect(pick('> [!no¦]', 'note', ['> body'])).toBe('> [!note]¦\n> body');
	});

	test('opens a new line when what follows is not part of the quote', () => {
		expect(pick('> [!no¦]', 'note', ['', 'text'])).toBe('> [!note]\n> ¦\n\ntext');
	});

	test('keeps the quote depth of a nested header', () => {
		expect(pick('> > [!no¦', 'note')).toBe('> > [!note]\n> > ¦');
	});

	test('keeps metadata after the id', () => {
		expect(pick('> [!no¦te|purple]', 'note')).toBe('> [!note|purple]\n> ¦');
	});
});
