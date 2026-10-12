import type { Callout } from '&callout';

import { filterAndSortCallouts } from './callout-search';
import type { AliasReader, CalloutStore } from './callout-store';
import { type CalloutRowStore, type EditResult, RowSession } from './row-session';
import { normalizeCalloutId } from './util/callout-id';

export type SortMode = 'name' | 'color' | 'icon';

const SORT_ORDER: readonly SortMode[] = ['name', 'color', 'icon'];

export type ManageStore = CalloutRowStore & AliasReader & Pick<CalloutStore, 'createCustomCallout'>;

/**
 * The state and rules behind the Manage pane's list: filter query, sort mode, the create-row
 * flag, and which callouts are visible. Holds no DOM; the pane renders it and applies the
 * {@link EditResult} hints. Per-row edits go through {@link rowFor}.
 */
export class ManageSession {
	private readonly store: ManageStore;
	private query = '';
	private _sortMode: SortMode = 'name';
	private _creating = false;
	private all: Callout[] = [];
	private _visible: Callout[] = [];

	public constructor(store: ManageStore) {
		this.store = store;
	}

	public get visible(): readonly Callout[] {
		return this._visible;
	}

	public get searchQuery(): string {
		return this.query;
	}

	public get sortMode(): SortMode {
		return this._sortMode;
	}

	public get isCreating(): boolean {
		return this._creating;
	}

	/** Re-reads the callouts from the store and re-applies the filter and sort. */
	public reload(): void {
		this.all = this.store.getCallouts();
		this.applyFilter();
	}

	public setQuery(query: string): void {
		this.query = query;
		this.applyFilter();
	}

	/** Advances to the next sort mode (name → color → icon → name) and returns it. */
	public cycleSort(): SortMode {
		this._sortMode = SORT_ORDER[(SORT_ORDER.indexOf(this._sortMode) + 1) % SORT_ORDER.length];
		this.applyFilter();
		return this._sortMode;
	}

	public startCreating(): void {
		this._creating = true;
	}

	public cancelCreating(): void {
		this._creating = false;
	}

	/**
	 * Creates a callout from free-form input. The repository silently accepts a duplicate create,
	 * so the duplicate check lives here. On success the create row closes and the list reloads.
	 */
	public create(raw: string): EditResult {
		const normalized = normalizeCalloutId(raw);
		if (!normalized.ok) return normalized;
		if (this.store.hasCallout(normalized.id)) {
			return { ok: false, reason: 'exists', message: `Callout '${normalized.id}' already exists.` };
		}
		try {
			this.store.createCustomCallout(normalized.id);
		} catch (error) {
			return { ok: false, reason: 'failed', message: error instanceof Error ? error.message : String(error) };
		}
		this._creating = false;
		this.reload();
		return { ok: true, changed: 'list' };
	}

	public rowFor(callout: Callout): RowSession {
		return new RowSession(callout, this.store, () => this.query.trim().length > 0);
	}

	private applyFilter(): void {
		this._visible = filterAndSortCallouts(this.all, this.query, {
			aliasGroups: this.store.getAliasGroups(),
			sortMode: this._sortMode,
		});
	}
}
