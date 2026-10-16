/**
 * The pure half of `[!` autocomplete: when typing a callout id should offer suggestions, what the
 * suggestions are, and what picking one writes. `CalloutSuggest` only adapts this to Obsidian's
 * `EditorSuggest`.
 */
import type Callout from '&callout';
import { normalizeCalloutId } from './util/callout-id';

import { filterAndSortCallouts } from './callout-search';
import { type InsertionEdit, frontmatterEnd } from './callout-writer';

const QUOTE_LEAD = /^(?: {0,3}>[ \t]?)+/;
const FENCE = /^ {0,3}(`{3,}|~{3,})(.*)$/;
const ID_CHARS = /^[A-Za-z0-9_-]*/;

/** A callout id being typed in a callout header: `> [!ide|`. */
export interface Trigger {
	line: number;
	/** Column range of the id characters, from just after `[!` to the last id character. */
	idStart: number;
	idEnd: number;
	/** The whole id under the cursor, independent of where in it the cursor sits. */
	id: string;
	/** The line's leading quote markers, as typed. */
	lead: string;
}

/** Whether `line` is inside a fenced code block, judging by the fences above it. */
function inFence(lines: readonly string[], line: number): boolean {
	let open: { char: string; length: number } | null = null;
	for (let i = 0; i < line; i++) {
		const text = (lines[i] ?? '').replace(QUOTE_LEAD, '');
		const match = FENCE.exec(text);
		if (!match) continue;
		const fence = match[1] ?? '';
		if (!open) open = { char: fence[0] ?? '', length: fence.length };
		else if (fence[0] === open.char && fence.length >= open.length && (match[2] ?? '').trim() === '') open = null;
	}
	return open !== null;
}

/**
 * The id being typed at `line`/`ch`, or null when autocomplete should stay closed: not in a callout
 * header (the `[!` must open the line's quote), past the id (metadata, the closing bracket, the
 * title), in the note's properties, or in a fenced code block. Kept cheap for the common case: it
 * is asked on every keystroke and the line test rules most lines out before any other line is read.
 */
export function readTrigger(lines: readonly string[], line: number, ch: number): Trigger | null {
	const text = lines[line];
	if (text === undefined) return null;

	const lead = QUOTE_LEAD.exec(text)?.[0];
	if (lead === undefined || !text.startsWith('[!', lead.length)) return null;

	const idStart = lead.length + 2;
	const id = ID_CHARS.exec(text.slice(idStart))?.[0] ?? '';
	const idEnd = idStart + id.length;
	if (ch < idStart || ch > idEnd) return null;

	const properties = frontmatterEnd(lines);
	if (properties !== -1 && line <= properties) return null;
	if (inFence(lines, line)) return null;
	return { line, idStart, idEnd, id, lead };
}

export type Choice = { kind: 'callout'; callout: Callout } | { kind: 'create'; id: string };

/**
 * What to offer for `query`: the matching callouts and, when the query is a valid id nothing already
 * answers to (as an id or an alias), a "create" row last.
 */
export function choicesFor(callouts: readonly Callout[], aliasGroups: Record<string, string[]>, query: string): Choice[] {
	const choices: Choice[] = filterAndSortCallouts(callouts, query, { aliasGroups }).map((callout) => ({ kind: 'callout', callout }));

	const normalized = normalizeCalloutId(query);
	if (normalized.ok) {
		const taken = callouts.some((c) => c.id === normalized.id) || Object.values(aliasGroups).some((group) => group.includes(normalized.id));
		if (!taken) choices.push({ kind: 'create', id: normalized.id });
	}
	return choices;
}

/**
 * What picking `id` writes: the id replaces what was typed, a missing `]` is added, and the cursor
 * goes where the callout's content is typed next, which is the end of the header when it already
 * has a title or a body below it, and otherwise a new quoted line under the header.
 */
export function planPick(lines: readonly string[], trigger: Trigger, id: string): InsertionEdit {
	const text = lines[trigger.line] ?? '';
	const afterId = text.slice(trigger.idEnd);
	const header = text.slice(0, trigger.idStart) + id + (afterId.includes(']') ? '' : ']') + afterId;

	const title = afterId.slice(afterId.indexOf(']') + 1).replace(/^[+-]/, '').trim();
	const next = lines[trigger.line + 1];
	const hasBody = next !== undefined && QUOTE_LEAD.test(next);
	const opensLine = title === '' && !hasBody;

	return {
		from: { line: trigger.line, ch: trigger.idStart },
		to: { line: trigger.line, ch: text.length },
		text: header.slice(trigger.idStart) + (opensLine ? '\n' + trigger.lead : ''),
		cursor: opensLine ? { line: trigger.line + 1, ch: trigger.lead.length } : { line: trigger.line, ch: header.length },
	};
}
