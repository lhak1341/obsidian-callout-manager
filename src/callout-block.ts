/**
 * Operations on a callout that is already in a note: find the one under a position, unwrap it,
 * change its fold marker, copy it, and pick the lines a "wrap" should cover. Pure (no editor, no
 * `obsidian`), like `callout-writer.ts`, whose conventions it shares: a callout is a run of
 * blockquote lines whose first line is `> [!id]`, and edits are returned as `Change`s.
 */
import { type FoldState, type InsertionEdit, type Position, type Selection, frontmatterEnd, isBlank } from './callout-writer';

/** Replace `from`..`to` with `text`. */
export interface Change {
	from: Position;
	to: Position;
	text: string;
}

export interface CalloutBlock {
	/** First and last line of the callout, inclusive. */
	start: number;
	end: number;
	/** How many quote markers its own lines start with (1 for a top-level callout). */
	depth: number;
	id: string;
	fold: FoldState;
	/** The title text after the `[!id]` marker, trimmed; empty for none or the hidden-title comment. */
	title: string;
}

const MARKER = /^ {0,3}>[ \t]?/;
const HEADER = /^\[!([^\]]+)\]([+-]?)(.*)$/;
const HEADING = /^ {0,3}#{1,6}(?:[ \t]|$)/;

/** A line's leading quote markers, each with its trailing space, and what follows them. */
function splitQuote(line: string): { markers: string[]; rest: string } {
	const markers: string[] = [];
	let rest = line;
	for (let match = MARKER.exec(rest); match; match = MARKER.exec(rest)) {
		markers.push(match[0]);
		rest = rest.slice(match[0].length);
	}
	return { markers, rest };
}

const depthOf = (line: string) => splitQuote(line).markers.length;

function parseHeader(line: string, depth: number): Omit<CalloutBlock, 'start' | 'end' | 'depth'> | null {
	const { markers, rest } = splitQuote(line);
	if (markers.length < depth) return null;
	const content = markers.slice(depth).join('') + rest;
	const match = HEADER.exec(content);
	if (!match) return null;
	const title = (match[3] ?? '').trim();
	return {
		id: (match[1] ?? '').split('|')[0] ?? '',
		fold: match[2] === '+' || match[2] === '-' ? match[2] : '',
		title: title === '%% %%' ? '' : title,
	};
}

/**
 * The innermost callout containing `line`, or null. A callout at depth `d` is the unbroken run of
 * lines with at least `d` quote markers around `line`; it is a callout when that run's first line,
 * after its `d` markers, is a `[!id]` header. Deeper quotes that are not callouts are skipped.
 */
export function findCalloutAt(lines: readonly string[], line: number): CalloutBlock | null {
	if (line < 0 || line >= lines.length) return null;

	for (let depth = depthOf(lines[line] ?? ''); depth >= 1; depth--) {
		let start = line;
		while (start > 0 && depthOf(lines[start - 1] ?? '') >= depth) start--;
		let end = line;
		while (end < lines.length - 1 && depthOf(lines[end + 1] ?? '') >= depth) end++;

		const header = parseHeader(lines[start] ?? '', depth);
		if (header) return { start, end, depth, ...header };
	}
	return null;
}

/** The lines of the callout, quote markers included, as they would be copied. */
export function calloutMarkdown(lines: readonly string[], block: CalloutBlock): string {
	return lines.slice(block.start, block.end + 1).join('\n');
}

/** What an unwrapped callout's lines look like with the innermost quote level removed. */
function outerAndInner(line: string, depth: number): { outer: string; inner: string } {
	const { markers, rest } = splitQuote(line);
	return { outer: markers.slice(0, depth - 1).join(''), inner: markers.slice(depth).join('') + rest };
}

/**
 * Removes one callout layer and keeps the content: the `[!id]` marker goes, the title (if any)
 * stays as a line of its own, and the body loses one quote level. Blank lines are added where the
 * result would otherwise touch text above or below and merge with it.
 */
export function planUnwrap(lines: readonly string[], block: CalloutBlock): InsertionEdit {
	const first = lines[block.start] ?? '';
	const { outer } = outerAndInner(first, block.depth);
	const blank = outer.trimEnd();

	const body = lines
		.slice(block.start + 1, block.end + 1)
		.map((line) => outer + outerAndInner(line, block.depth).inner);
	const hasBody = body.some((line) => line.slice(outer.length).trim() !== '');

	const out: string[] = [];
	if (block.title) out.push(outer + block.title);
	if (block.title && hasBody) out.push(blank);
	if (hasBody) out.push(...body);

	// A callout with nothing in it leaves one blank line, which inside a quote must be a bare `>`
	// so the enclosing quote is not split.
	if (out.length === 0) out.push(blank);

	const above = block.start > 0 ? lines[block.start - 1] : undefined;
	const below = lines[block.end + 1];
	const touchesText = out.some((line) => line.slice(outer.length).trim() !== '');
	const needAbove = touchesText && above !== undefined && !isBlank(above, outer);
	const needBelow = touchesText && below !== undefined && !isBlank(below, outer);
	if (needAbove) out.unshift(blank);
	if (needBelow) out.push(blank);

	const firstContent = needAbove ? 1 : 0;
	return {
		from: { line: block.start, ch: 0 },
		to: { line: block.end, ch: (lines[block.end] ?? '').length },
		text: out.join('\n'),
		cursor: { line: block.start + firstContent, ch: outer.length },
	};
}

/** Rewrites the header's fold marker (`''` = not foldable, `+` = open, `-` = closed). */
export function planFold(lines: readonly string[], block: CalloutBlock, fold: FoldState): Change {
	const line = lines[block.start] ?? '';
	const { markers, rest } = splitQuote(line);
	const own = markers.slice(0, block.depth).join('');
	const content = markers.slice(block.depth).join('') + rest;
	const text = own + content.replace(/^(\[![^\]]+\])[+-]?/, `$1${fold}`);
	return { from: { line: block.start, ch: 0 }, to: { line: block.start, ch: line.length }, text };
}

/**
 * The lines a "wrap" should cover: every line a selection touches (not the last one when the
 * selection ends at its very start), or, for a plain cursor, the paragraph it is in. Null when
 * there is nothing to wrap: a cursor on a blank line, a heading, or inside the note's properties.
 */
export function wrapRange(lines: readonly string[], selection: Selection): Selection | null {
	const lastLine = (n: number) => ({ line: n, ch: (lines[n] ?? '').length });
	const properties = frontmatterEnd(lines);
	const { from, to } = selection;

	if (from.line !== to.line || from.ch !== to.ch) {
		let end = to.line;
		if (to.ch === 0 && to.line > from.line) end--;
		const start = from.line;
		if (properties !== -1 && start <= properties) return null;
		return { from: { line: start, ch: 0 }, to: lastLine(end) };
	}

	const line = from.line;
	const text = lines[line] ?? '';
	if (properties !== -1 && line <= properties) return null;
	const quote = depthOf(text);
	if (isBlank(text, quote ? '>' : '') || HEADING.test(text)) return null;

	const inParagraph = (n: number) => {
		const l = lines[n];
		return l !== undefined && depthOf(l) === quote && !isBlank(l, quote ? '>' : '') && !HEADING.test(l);
	};
	let start = line;
	while (start > 0 && inParagraph(start - 1) && (properties === -1 || start - 1 > properties)) start--;
	let end = line;
	while (inParagraph(end + 1)) end++;
	return { from: { line: start, ch: 0 }, to: lastLine(end) };
}
