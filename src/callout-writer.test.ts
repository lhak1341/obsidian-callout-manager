import { describe, expect, test } from '@jest/globals';

import { type CalloutSpec, type InsertionEdit, type Position, planInsertion, selectedBody } from './callout-writer';

/**
 * Fixtures mark the cursor with `|` and a selection with `‹…›`. `result()` returns the document
 * after the edit with `|` at the new cursor, so a case reads as before → after.
 */
function parse(source: string) {
	const open = source.indexOf('‹');
	const close = source.indexOf('›');
	const at = (flat: number, text: string): Position => {
		const before = text.slice(0, flat).split('\n');
		return { line: before.length - 1, ch: before[before.length - 1]?.length ?? 0 };
	};

	if (open !== -1 && close !== -1) {
		const text = source.slice(0, open) + source.slice(open + 1, close) + source.slice(close + 1);
		return { text, selection: { from: at(open, text), to: at(close - 1, text) } };
	}
	const bar = source.indexOf('|');
	const text = source.slice(0, bar) + source.slice(bar + 1);
	return { text, selection: { from: at(bar, text), to: at(bar, text) } };
}

const SPEC: CalloutSpec = { id: 'note', fold: '', title: 'T', body: 'x' };

function apply(text: string, edit: InsertionEdit): string {
	const lines = text.split('\n');
	const flat = (p: Position) => lines.slice(0, p.line).reduce((n, l) => n + l.length + 1, 0) + p.ch;
	const after = text.slice(0, flat(edit.from)) + edit.text + text.slice(flat(edit.to));

	// Where the cursor is in `after`: the start position's offset in the original text plus the
	// text written up to the cursor line.
	const written = edit.text.split('\n');
	const startFlat = flat(edit.from);
	const upToCursor = written.slice(0, edit.cursor.line - edit.from.line + 1);
	const last = upToCursor.length - 1;
	const offset = startFlat + upToCursor.slice(0, last).reduce((n, l) => n + l.length + 1, 0) + edit.cursor.ch - (last === 0 ? edit.from.ch : 0);
	return after.slice(0, offset) + '|' + after.slice(offset);
}

function result(source: string, spec: Partial<CalloutSpec> = {}): string {
	const { text, selection } = parse(source);
	return apply(text, planInsertion(text.split('\n'), selection, { ...SPEC, ...spec }));
}

describe('planInsertion on plain text', () => {
	test('an empty note gets just the callout, cursor at the end of its last line', () => {
		expect(result('|', { body: '' })).toBe('> [!note] T\n>  |');
	});

	test('an empty line is replaced, with no extra blank lines when already separated', () => {
		expect(result('a\n\n|\n\nb')).toBe('a\n\n> [!note] T\n> x|\n\nb');
	});

	test('text above and below is separated from the callout by a blank line', () => {
		expect(result('a\n|\nb')).toBe('a\n\n> [!note] T\n> x|\n\nb');
	});

	test('a cursor at the end of a line leaves that line alone and starts below it', () => {
		expect(result('text|')).toBe('text\n\n> [!note] T\n> x|');
	});

	test('a cursor mid-line splits the line; the rest moves below the callout', () => {
		expect(result('foo |bar')).toBe('foo \n\n> [!note] T\n> x|\n\nbar');
	});

	test('a cursor at the start of a non-blank line puts the callout above it', () => {
		expect(result('|text')).toBe('> [!note] T\n> x|\n\ntext');
	});

	test('a selection inside a line is replaced, and the text around it survives on its own lines', () => {
		expect(result('a ‹b› c', { body: 'b' })).toBe('a \n\n> [!note] T\n> b|\n\nc');
	});

	test('a selection of whole lines (ending at the next line start) wraps exactly those lines', () => {
		expect(result('a\n‹b\nc\n›d', { body: 'b\nc' })).toBe('a\n\n> [!note] T\n> b\n> c|\n\nd');
	});

	test('a reversed selection behaves like a forward one', () => {
		const edit = planInsertion(['a b c'], { from: { line: 0, ch: 3 }, to: { line: 0, ch: 2 } }, SPEC);
		expect(apply('a b c', edit)).toBe('a \n\n> [!note] T\n> x|\n\nc');
	});

	test('out-of-range positions are clamped instead of throwing', () => {
		const edit = planInsertion(['a'], { from: { line: 9, ch: 9 }, to: { line: 9, ch: 9 } }, SPEC);
		expect(apply('a', edit)).toBe('a\n\n> [!note] T\n> x|');
		expect(edit.from).toEqual({ line: 0, ch: 1 });
		expect(edit.to).toEqual({ line: 0, ch: 1 });
	});

	test('a blank title becomes the hidden-title comment and the fold marker is written', () => {
		expect(result('|', { title: '  ', fold: '+' })).toBe('> [!note]+ %% %%\n> x|');
		expect(result('|', { fold: '-' })).toBe('> [!note]- T\n> x|');
	});

	test('every body line is quoted, blank ones included', () => {
		expect(result('|', { body: 'one\n\nthree' })).toBe('> [!note] T\n> one\n> \n> three|');
	});

	test('the body and title are trimmed', () => {
		expect(result('|', { title: ' Hi ', body: '  b  ' })).toBe('> [!note] Hi\n> b|');
	});
});

describe('planInsertion inside a blockquote or callout', () => {
	test('nests the callout one level deeper and keeps the enclosing quote unbroken', () => {
		expect(result('> a\n> |')).toBe('> a\n>\n> > [!note] T\n> > x|');
	});

	test('text before the cursor on a quote line stays; the nested callout starts below it', () => {
		expect(result('> foo|')).toBe('> foo\n>\n> > [!note] T\n> > x|');
	});

	test('a following quote line is separated by a blank quote line, not a bare blank line', () => {
		expect(result('> |\n> b')).toBe('> > [!note] T\n> > x|\n>\n> b');
	});

	test('wrapping lines of a callout body nests them, with the shared quote removed from the body', () => {
		const { text, selection } = parse('> [!tip] Hi\n> ‹a\n> b›');
		expect(selectedBody(text.split('\n'), selection)).toBe('a\nb');
		const edit = planInsertion(text.split('\n'), selection, { ...SPEC, body: 'a\nb' });
		expect(apply(text, edit)).toBe('> [!tip] Hi\n>\n> > [!note] T\n> > a\n> > b|');
	});

	test('a selection spanning different quote levels deletes nothing', () => {
		const { text, selection } = parse('> a‹\nb›');
		const edit = planInsertion(text.split('\n'), selection, SPEC);
		expect(apply(text, edit)).toContain('\nb');
		expect(selectedBody(text.split('\n'), selection)).toBe('');
	});

	test('a cursor inside the quote marker is moved to the start of the content', () => {
		const edit = planInsertion(['> a', '> b'], { from: { line: 1, ch: 0 }, to: { line: 1, ch: 0 } }, SPEC);
		expect(apply('> a\n> b', edit)).toBe('> a\n>\n> > [!note] T\n> > x|\n>\n> b');
	});
});

describe('planInsertion in deeper quotes and indented text', () => {
	test('inside a doubly nested quote the callout goes one level deeper again', () => {
		expect(result('> > a|')).toBe('> > a\n> >\n> > > [!note] T\n> > > x|');
	});

	test('a bare quote marker above counts as a blank line, so none is added', () => {
		expect(result('> a\n>\n> |')).toBe('> a\n>\n> > [!note] T\n> > x|');
	});

	test('an indented continuation line keeps the callout at the same indentation', () => {
		expect(result('  foo|')).toBe('  foo\n\n  > [!note] T\n  > x|');
	});
});

describe('planInsertion inside a list item', () => {
	test('a cursor right after the marker starts the callout on the marker line', () => {
		expect(result('- |')).toBe('- > [!note] T\n  > x|');
	});

	test('selecting the item text wraps it in place', () => {
		expect(result('- ‹item›', { body: 'item' })).toBe('- > [!note] T\n  > item|');
	});

	test('numbered markers indent by their width', () => {
		expect(result('10. |')).toBe('10. > [!note] T\n    > x|');
	});

	test('text before the cursor in the item stays, and the callout is indented under it', () => {
		expect(result('- foo|')).toBe('- foo\n\n  > [!note] T\n  > x|');
	});

	test('a cursor before the marker does not indent anything', () => {
		expect(result('|- foo')).toBe('> [!note] T\n> x|\n\n- foo');
	});
});

describe('planInsertion and note properties', () => {
	test('a cursor inside the properties inserts after them', () => {
		expect(result('---\na|: 1\n---\nbody')).toBe('---\na: 1\n---\n\n> [!note] T\n> x|\n\nbody');
	});

	test('a selection inside the properties is not replaced', () => {
		const out = result('---\n‹a: 1›\n---');
		expect(out).toBe('---\na: 1\n---\n\n> [!note] T\n> x|');
	});

	test('a cursor on the closing line also goes after it', () => {
		expect(result('---\na: 1\n---|')).toBe('---\na: 1\n---\n\n> [!note] T\n> x|');
	});

	test('a --- further down the note is a rule, not the end of properties', () => {
		expect(result('a|\n---\nb')).toBe('a\n\n> [!note] T\n> x|\n\n---\nb');
	});

	test('a note whose first line is --- but never closes it has no properties', () => {
		expect(result('---\n|')).toBe('---\n\n> [!note] T\n> x|');
	});

	test('the first line after the properties is ordinary text', () => {
		expect(result('---\na: 1\n---\n|')).toBe('---\na: 1\n---\n\n> [!note] T\n> x|');
	});
});

describe('selectedBody', () => {
	test('the exact text of a single-line selection', () => {
		const { text, selection } = parse('a ‹b c› d');
		expect(selectedBody(text.split('\n'), selection)).toBe('b c');
	});

	test('nothing for a cursor', () => {
		const { text, selection } = parse('a|b');
		expect(selectedBody(text.split('\n'), selection)).toBe('');
	});

	test('a multi-line selection keeps its lines, from the cursor on the first line', () => {
		const { text, selection } = parse('a ‹b\nc\nd› e');
		expect(selectedBody(text.split('\n'), selection)).toBe('b\nc\nd');
	});

	test('list indentation shared by the selected lines is removed', () => {
		const { text, selection } = parse('- ‹a\n  b\n  c›');
		expect(selectedBody(text.split('\n'), selection)).toBe('a\nb\nc');
	});

	test('a selection ending at the next line start excludes that line', () => {
		const { text, selection } = parse('‹a\nb\n›c');
		expect(selectedBody(text.split('\n'), selection)).toBe('a\nb');
	});
});
