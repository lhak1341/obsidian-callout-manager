import { describe, expect, test } from '@jest/globals';

import { type Change, calloutMarkdown, findCalloutAt, planFold, planUnwrap, wrapRange } from './callout-block';
import type { Position } from './callout-writer';

const doc = (source: string) => source.split('\n');

function applyChange(lines: readonly string[], change: Change): string {
	const flat = (p: Position) => lines.slice(0, p.line).reduce((n, l) => n + l.length + 1, 0) + p.ch;
	const text = lines.join('\n');
	return text.slice(0, flat(change.from)) + change.text + text.slice(flat(change.to));
}

function unwrapped(source: string, line: number): string {
	const lines = doc(source);
	const block = findCalloutAt(lines, line);
	if (!block) throw new Error('no callout at that line');
	return applyChange(lines, planUnwrap(lines, block));
}

describe('findCalloutAt', () => {
	const lines = doc('before\n\n> [!note]+ My title\n> body\n>\n> more\n\nafter');

	test.each([2, 3, 4, 5])('finds the callout from line %i, header to last body line', (line) => {
		expect(findCalloutAt(lines, line)).toEqual({ start: 2, end: 5, depth: 1, id: 'note', fold: '+', title: 'My title' });
	});

	test.each([0, 1, 6, 7, -1, 99])('finds nothing on line %i, outside the callout', (line) => {
		expect(findCalloutAt(lines, line)).toBeNull();
	});

	test('a plain blockquote is not a callout', () => {
		expect(findCalloutAt(doc('> just a quote\n> more'), 0)).toBeNull();
	});

	test('reads the fold marker and an empty or hidden title', () => {
		expect(findCalloutAt(doc('> [!tip]-'), 0)).toMatchObject({ id: 'tip', fold: '-', title: '' });
		expect(findCalloutAt(doc('> [!tip]'), 0)).toMatchObject({ fold: '', title: '' });
		expect(findCalloutAt(doc('> [!tip] %% %%\n> x'), 0)).toMatchObject({ title: '' });
	});

	test('the id stops at metadata after a pipe', () => {
		expect(findCalloutAt(doc('> [!note|purple] T'), 0)).toMatchObject({ id: 'note', title: 'T' });
	});

	test('the innermost callout wins, and its own lines are the nested run', () => {
		const nested = doc('> [!tip] Outer\n> text\n> > [!note] Inner\n> > deep\n> after');
		expect(findCalloutAt(nested, 3)).toEqual({ start: 2, end: 3, depth: 2, id: 'note', fold: '', title: 'Inner' });
		expect(findCalloutAt(nested, 1)).toMatchObject({ start: 0, end: 4, depth: 1, id: 'tip' });
		expect(findCalloutAt(nested, 4)).toMatchObject({ start: 0, id: 'tip' });
	});

	test('a plain quote nested in a callout resolves to the callout around it', () => {
		const nested = doc('> [!tip] T\n> > plain\n> > quote');
		expect(findCalloutAt(nested, 2)).toMatchObject({ start: 0, end: 2, depth: 1, id: 'tip' });
	});

	test('two callouts separated by a blank line are found separately', () => {
		const two = doc('> [!a] A\n> x\n\n> [!b] B\n> y');
		expect(findCalloutAt(two, 1)).toMatchObject({ id: 'a', start: 0, end: 1 });
		expect(findCalloutAt(two, 4)).toMatchObject({ id: 'b', start: 3, end: 4 });
	});

	test('a [!x] line in the middle of a quote is body text, not a new callout', () => {
		const lines2 = doc('> [!a] A\n> [!b] B');
		expect(findCalloutAt(lines2, 1)).toMatchObject({ id: 'a', start: 0, end: 1 });
	});

	test('a quote that starts deeper than the cursor line has no header at that depth', () => {
		expect(findCalloutAt(doc('> > [!note] T\n> x'), 1)).toBeNull();
	});
});

describe('calloutMarkdown', () => {
	test('is the callout lines verbatim', () => {
		const lines = doc('a\n> [!note] T\n> body\nb');
		const block = findCalloutAt(lines, 1);
		expect(block && calloutMarkdown(lines, block)).toBe('> [!note] T\n> body');
	});
});

describe('planUnwrap', () => {
	test('removes the marker and one quote level, keeping the title as its own paragraph', () => {
		expect(unwrapped('> [!note] Title\n> first\n> second', 0)).toBe('Title\n\nfirst\nsecond');
	});

	test('without a title (or with the hidden-title comment) only the body remains', () => {
		expect(unwrapped('> [!note]\n> body', 1)).toBe('body');
		expect(unwrapped('> [!note] %% %%\n> body', 0)).toBe('body');
	});

	test('a title with no body leaves just the title', () => {
		expect(unwrapped('> [!note] Title', 0)).toBe('Title');
	});

	test('blank quote lines in the body become blank lines', () => {
		expect(unwrapped('> [!note]\n> a\n>\n> b', 0)).toBe('a\n\nb');
	});

	test('nested blocks inside the body keep their own quote level', () => {
		expect(unwrapped('> [!tip] Outer\n> > [!note] Inner\n> > x', 0)).toBe('Outer\n\n> [!note] Inner\n> x');
	});

	test('unwraps only the innermost layer and keeps the outer quote around the result', () => {
		expect(unwrapped('> [!tip] Outer\n> > [!note] Inner\n> > x', 2)).toBe('> [!tip] Outer\n>\n> Inner\n>\n> x');
	});

	test('text directly above and below is separated from the unwrapped lines', () => {
		expect(unwrapped('above\n> [!note]\n> body\nbelow', 1)).toBe('above\n\nbody\n\nbelow');
	});

	test('already separated text gets no extra blank lines', () => {
		expect(unwrapped('above\n\n> [!note]\n> body\n\nbelow', 2)).toBe('above\n\nbody\n\nbelow');
	});

	test('an empty callout disappears', () => {
		expect(unwrapped('a\n\n> [!note]\n> \n\nb', 2)).toBe('a\n\n\n\nb');
	});

	test('an empty callout inside a quote leaves a bare quote marker, not a gap that splits the quote', () => {
		expect(unwrapped('> [!tip] O\n> > [!note]\n> > \n> after', 1)).toBe('> [!tip] O\n>\n> after');
	});

	test('the cursor lands on the first line of the result', () => {
		const lines = doc('above\n> [!note]\n> body');
		const block = findCalloutAt(lines, 1);
		expect(block && planUnwrap(lines, block).cursor).toEqual({ line: 2, ch: 0 });
		const nested = doc('> [!tip] O\n> > [!note]\n> > x');
		const inner = findCalloutAt(nested, 2);
		expect(inner && planUnwrap(nested, inner).cursor).toEqual({ line: 2, ch: 2 }); // a blank quote line goes above it
	});
});

describe('planFold', () => {
	const fold = (source: string, line: number, to: '' | '+' | '-') => {
		const lines = doc(source);
		const block = findCalloutAt(lines, line);
		if (!block) throw new Error('no callout');
		return applyChange(lines, planFold(lines, block, to));
	};

	test('adds, changes and removes the marker, keeping the title and body', () => {
		expect(fold('> [!note] T\n> b', 0, '+')).toBe('> [!note]+ T\n> b');
		expect(fold('> [!note]+ T\n> b', 1, '-')).toBe('> [!note]- T\n> b');
		expect(fold('> [!note]- T\n> b', 0, '')).toBe('> [!note] T\n> b');
	});

	test('works on a nested callout and on metadata', () => {
		expect(fold('> [!tip] O\n> > [!note|wide] I\n> > x', 2, '-')).toBe('> [!tip] O\n> > [!note|wide]- I\n> > x');
	});

	test('a header with no title keeps none', () => {
		expect(fold('> [!note]\n> b', 0, '+')).toBe('> [!note]+\n> b');
	});
});

describe('wrapRange', () => {
	const range = (source: string, from: Position, to: Position = from) => wrapRange(doc(source), { from, to });

	test('a selection covers every line it touches, whole', () => {
		expect(range('aa\nbb\ncc', { line: 0, ch: 1 }, { line: 1, ch: 1 })).toEqual({ from: { line: 0, ch: 0 }, to: { line: 1, ch: 2 } });
	});

	test('a selection ending at the very start of a line leaves that line out', () => {
		expect(range('aa\nbb\ncc', { line: 0, ch: 0 }, { line: 2, ch: 0 })).toEqual({ from: { line: 0, ch: 0 }, to: { line: 1, ch: 2 } });
	});

	test('a cursor selects its paragraph, up to the nearest blank lines', () => {
		expect(range('x\n\naa\nbb\ncc\n\ny', { line: 3, ch: 1 })).toEqual({ from: { line: 2, ch: 0 }, to: { line: 4, ch: 2 } });
	});

	test('headings directly above and below stay out of the paragraph', () => {
		expect(range('# H\naa\nbb\n## H2', { line: 1, ch: 0 })).toEqual({ from: { line: 1, ch: 0 }, to: { line: 2, ch: 2 } });
	});

	test('a cursor on a blank line or a heading has nothing to wrap', () => {
		expect(range('a\n\nb', { line: 1, ch: 0 })).toBeNull();
		expect(range('# H\nb', { line: 0, ch: 2 })).toBeNull();
	});

	test('a paragraph inside a quote stops at the quote level', () => {
		expect(range('> a\n> b\n\n> c', { line: 0, ch: 0 })).toEqual({ from: { line: 0, ch: 0 }, to: { line: 1, ch: 3 } });
		expect(range('> a\n> > b', { line: 0, ch: 0 })).toEqual({ from: { line: 0, ch: 0 }, to: { line: 0, ch: 3 } });
	});

	test('a bare quote marker is a blank line inside a quote', () => {
		expect(range('> a\n>\n> b', { line: 0, ch: 0 })).toEqual({ from: { line: 0, ch: 0 }, to: { line: 0, ch: 3 } });
	});

	test('the note properties are never wrapped', () => {
		expect(range('---\na: 1\n---\nbody', { line: 1, ch: 0 })).toBeNull();
		expect(range('---\na: 1\n---\nbody', { line: 1, ch: 0 }, { line: 3, ch: 2 })).toBeNull();
		expect(range('---\na: 1\n---\nbody\nmore', { line: 3, ch: 0 })).toEqual({ from: { line: 3, ch: 0 }, to: { line: 4, ch: 4 } });
	});
});
