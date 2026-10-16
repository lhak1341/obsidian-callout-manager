/**
 * Turns "insert this callout here" into one editor edit. Pure (no editor, no `obsidian`) so every
 * placement rule is testable; `InsertCalloutModal` only reads the document and selection, asks for
 * the edit, and applies it.
 *
 * What it guarantees about the surrounding note:
 * - Text before the cursor and after the selection stays outside the callout, on lines of its own.
 *   (Replacing the bare selection used to glue the rest of the last line onto the callout.)
 * - A callout never touches non-blank text above or below it, since the text below would otherwise
 *   be pulled in as a lazy blockquote continuation.
 * - Inside a blockquote or callout the new callout is nested (`> > [!note]`), and inside a list
 *   item it stays in the item (indented, or on the marker's own line when the cursor sits right
 *   after the marker).
 * - Nothing is ever written into the note's properties (frontmatter).
 *
 * Not handled: a cursor inside a fenced code block still gets the callout written there.
 */

export interface Position {
	line: number;
	ch: number;
}

export interface Selection {
	from: Position;
	to: Position;
}

export type FoldState = '' | '+' | '-';

export interface CalloutSpec {
	id: string;
	fold: FoldState;
	/** Blank becomes a `%% %%` comment, which Obsidian renders as an empty title. */
	title: string;
	/** The body without any quote markers. */
	body: string;
}

/** Replace `from`..`to` with `text`, then put the cursor at `cursor`. */
export interface InsertionEdit {
	from: Position;
	to: Position;
	text: string;
	cursor: Position;
}

const QUOTE_PREFIX = /^(?: {0,3}>[ \t]?)+/;
const LIST_MARKER = /^\s*(?:[-*+]|\d{1,9}[.)])[ \t]+/;

interface Context {
	/** The leading `> ` markers of the cursor's line, verbatim. */
	quote: string;
	/** What keeps new lines inside the cursor's list item, or the line's own indentation. */
	indent: string;
	/** The cursor sits right after a list marker, so the callout can start on that line. */
	markerOnly: boolean;
}

function contextAt(line: string, ch: number): Context {
	const quote = QUOTE_PREFIX.exec(line)?.[0] ?? '';
	const rest = line.slice(quote.length);
	const column = ch - quote.length;

	const item = LIST_MARKER.exec(rest);
	if (item && column >= item[0].length) {
		return { quote, indent: ' '.repeat(item[0].length), markerOnly: rest.slice(item[0].length, column).trim() === '' };
	}

	const indent = /^\s*/.exec(rest)?.[0] ?? '';
	return { quote, indent: item ? '' : indent, markerOnly: false };
}

/** The index of the line closing the note's properties, or -1 when it has none. */
export function frontmatterEnd(lines: readonly string[]): number {
	if (lines[0]?.trimEnd() !== '---') return -1;
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i]?.trimEnd();
		if (line === '---') return i;
	}
	return -1;
}

interface Normalized {
	from: Position;
	to: Position;
	context: Context;
}

/**
 * Orders and clamps the selection, then shrinks it to what can safely be replaced: a cursor in the
 * properties moves to just after them, a selection that spans different quote levels collapses to
 * its start (nothing is deleted), and one that ends at the very start of a line stops at the
 * previous line's end.
 */
function normalize(lines: readonly string[], selection: Selection): Normalized {
	const last = Math.max(lines.length - 1, 0);
	const clamp = (p: Position): Position => {
		const line = Math.min(Math.max(p.line, 0), last);
		return { line, ch: Math.min(Math.max(p.ch, 0), (lines[line] ?? '').length) };
	};
	const before = (a: Position, b: Position) => a.line < b.line || (a.line === b.line && a.ch <= b.ch);

	let from = clamp(selection.from);
	let to = clamp(selection.to);
	if (!before(from, to)) [from, to] = [to, from];

	const properties = frontmatterEnd(lines);
	if (properties !== -1 && from.line <= properties) {
		from = to = { line: properties, ch: (lines[properties] ?? '').length };
	}

	if (to.line > from.line && to.ch === 0) to = { line: to.line - 1, ch: (lines[to.line - 1] ?? '').length };

	const context = contextAt(lines[from.line] ?? '', from.ch);
	from = { line: from.line, ch: Math.max(from.ch, context.quote.length) };

	for (let i = from.line + 1; i <= to.line; i++) {
		if ((QUOTE_PREFIX.exec(lines[i] ?? '')?.[0] ?? '') !== context.quote) {
			to = from;
			break;
		}
	}
	// Neither end may sit inside the quote markers.
	to = { line: to.line, ch: Math.max(to.ch, context.quote.length) };
	return { from, to, context };
}

/**
 * The selected text as callout body: the quote markers and list indentation that the selected
 * lines share are removed, so wrapping part of a callout nests it instead of doubling the `>`.
 */
export function selectedBody(lines: readonly string[], selection: Selection): string {
	const { from, to, context } = normalize(lines, selection);
	if (from.line === to.line) return (lines[from.line] ?? '').slice(from.ch, to.ch);

	const stripped = (line: string) => {
		const content = line.slice(context.quote.length);
		return content.startsWith(context.indent) ? content.slice(context.indent.length) : content.trimStart();
	};

	const parts: string[] = [(lines[from.line] ?? '').slice(from.ch)];
	for (let i = from.line + 1; i < to.line; i++) parts.push(stripped(lines[i] ?? ''));
	const lastLine = lines[to.line] ?? '';
	parts.push(stripped(lastLine.slice(0, to.ch)));
	return parts.join('\n');
}

/** Whether a line separates blocks where the cursor is: empty, or (in a quote) only markers. */
export function isBlank(line: string, quote: string): boolean {
	return line.trim() === '' || (quote !== '' && /^[\s>]*$/.test(line));
}

export function planInsertion(lines: readonly string[], selection: Selection, spec: CalloutSpec): InsertionEdit {
	const { from, to, context } = normalize(lines, selection);
	const { quote, indent, markerOnly } = context;
	const prefix = quote + indent;
	// A blank line that stays inside the enclosing quote, so the quote is not ended by it.
	const blank = prefix.trimEnd();

	const fromLine = lines[from.line] ?? '';
	const toLine = lines[to.line] ?? '';
	const beforeCursor = fromLine.slice(quote.length, from.ch).trim();
	const hasBefore = beforeCursor !== ''; // only read once `markerOnly` has been ruled out
	const after = toLine.slice(to.ch).trim();

	const title = spec.title.trim() || '%% %%';
	const body = spec.body.trim();
	const callout = [`> [!${spec.id}]${spec.fold} ${title}`, ...(body ? body.split('\n') : [' ']).map((l) => `> ${l}`)];
	const calloutLines = callout.map((line, i) => (i === 0 && markerOnly ? line : prefix + line));

	// Line 0 of `out` continues the text already at `start`.
	let start: Position;
	let out: string[];
	if (markerOnly) {
		start = from;
		out = calloutLines;
	} else if (hasBefore) {
		start = from;
		out = ['', blank, ...calloutLines];
	} else {
		start = { line: from.line, ch: 0 };
		const above = from.line > 0 ? lines[from.line - 1] : undefined;
		out = above !== undefined && !isBlank(above, quote) ? [blank, ...calloutLines] : calloutLines;
	}

	const calloutEnd = out.length - 1;
	const next = lines[to.line + 1];
	if (after) out.push(blank, prefix + after);
	else if (next !== undefined && !isBlank(next, quote)) out.push(blank);

	return {
		from: start,
		to: { line: to.line, ch: toLine.length },
		text: out.join('\n'),
		cursor: {
			line: start.line + calloutEnd,
			ch: calloutEnd === 0 ? start.ch + (out[0] ?? '').length : (out[calloutEnd] ?? '').length,
		},
	};
}
