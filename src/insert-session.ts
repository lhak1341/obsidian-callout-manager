import Callout from '&callout';

import { type FoldState, type InsertionEdit, type Selection, planInsertion } from './callout-writer';
import { filterAndSortCallouts } from './callout-search';

export type { FoldState } from './callout-writer';

export interface InsertSessionOptions {
	/** Alias groups keyed by canonical callout id; alias text is searchable when given. */
	aliasGroups?: Record<string, string[]>;
	/** Text to pre-fill the callout body with (e.g. the editor selection). */
	initialContent?: string;
}

/**
 * The state and rules behind the "Insert callout" modal: which callouts match the search, which
 * one is selected, the fold/title/body being entered, and the markdown those produce. Holds no
 * DOM or editor, so the modal only renders it and applies the {@link Insertion} it returns.
 */
export class InsertSession {
	public fold: FoldState = '';
	public title = '';
	public content: string;

	private readonly all: readonly Callout[];
	private readonly aliasGroups?: Record<string, string[]>;
	private query = '';
	private _filtered: Callout[];
	private _selected: Callout | null;

	public constructor(callouts: readonly Callout[], options: InsertSessionOptions = {}) {
		this.all = callouts;
		this.aliasGroups = options.aliasGroups;
		this.content = options.initialContent ?? '';
		this._filtered = this.applyFilter();
		this._selected = this._filtered[0] ?? null;
	}

	public get filtered(): readonly Callout[] {
		return this._filtered;
	}

	public get selected(): Callout | null {
		return this._selected;
	}

	/** Filters the list. The selection follows the first match only if the selected callout is filtered out. */
	public setQuery(query: string): void {
		this.query = query;
		this._filtered = this.applyFilter();
		if (this._filtered.length > 0 && !this._filtered.some((c) => c.id === this._selected?.id)) {
			this._selected = this._filtered[0];
		}
	}

	public select(id: string): void {
		const callout = this.all.find((c) => c.id === id);
		if (callout) this._selected = callout;
	}

	public setFold(fold: FoldState): void {
		this.fold = fold;
	}

	public setTitle(title: string): void {
		this.title = title;
	}

	public setContent(content: string): void {
		this.content = content;
	}

	/**
	 * What the callout will look like once inserted. A blank title is inserted as a `%% %%`
	 * comment, which Obsidian renders as an empty title, so the preview title is empty too.
	 */
	public preview(): { id: string; title: string; content: string | undefined } | null {
		if (!this._selected) return null;
		return {
			id: this._selected.id,
			title: this.title.trim(),
			content: this.content.trim() || undefined,
		};
	}

	/**
	 * Builds the editor edit that inserts the callout over `selection` in the document `lines`.
	 * Where it goes and what surrounds it is decided by {@link planInsertion}.
	 */
	public toInsertion(lines: readonly string[], selection: Selection): InsertionEdit | null {
		const callout = this._selected;
		if (!callout) return null;
		return planInsertion(lines, selection, { id: callout.id, fold: this.fold, title: this.title, body: this.content });
	}

	private applyFilter(): Callout[] {
		return filterAndSortCallouts(this.all, this.query, { aliasGroups: this.aliasGroups });
	}
}
