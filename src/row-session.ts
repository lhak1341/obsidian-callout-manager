import type { App } from 'obsidian';

import type { Callout } from '&callout';

import { determineAppearanceType, unifiedAppearanceToSettings } from './callout-appearance';
import type { AliasStore, CalloutReader, CalloutStore } from './callout-store';
import { isValidCalloutId, normalizeCalloutId } from './util/callout-id';

export type CalloutRowStore = CalloutReader &
	AliasStore &
	Pick<CalloutStore, 'setCalloutSettings' | 'renameCustomCallout' | 'removeCustomCallout'>;

/** What the UI must rebuild after a successful edit: the whole list, just this row, or nothing. */
export type Changed = 'list' | 'row' | 'none';

export type EditResult =
	| { ok: true; changed: Changed }
	| { ok: false; reason: 'empty' | 'invalid' | 'exists' | 'unchanged' | 'failed'; message: string };

/**
 * The state and rules behind one editable row of the Manage pane: the color/icon draft, the alias
 * list, rename and delete. Holds no DOM, so the row only renders it and forwards events.
 *
 * Inline color/icon editing is only valid for a 'unified' appearance; a 'complex' one
 * (conditional, duplicate-key, or anything beyond color/icon) is read-only here, so an edit can
 * never overwrite settings this UI cannot represent.
 */
export class RowSession {
	public readonly callout: Callout;
	public readonly isComplex: boolean;

	private readonly store: CalloutRowStore;
	private readonly isFiltering: () => boolean;
	private _color: string;
	private _icon: string;
	private _aliases: string[];

	/** @param isFiltering Whether a list filter is active; alias edits can then change which rows match. */
	public constructor(callout: Callout, store: CalloutRowStore, isFiltering: () => boolean = () => false) {
		this.callout = callout;
		this.store = store;
		this.isFiltering = isFiltering;

		const saved = store.getCalloutSettings(callout.id);
		const appearance = saved ? determineAppearanceType(saved) : null;
		this.isComplex = appearance?.type === 'complex';
		this._color = appearance?.type === 'unified' ? (appearance.color ?? '') : '';
		this._icon = appearance?.type === 'unified' ? (appearance.otherChanges.icon ?? '') : '';
		this._aliases = [...(store.getAliasGroups()[callout.id] ?? [])];
	}

	public get app(): App {
		return this.store.app;
	}

	public get color(): string {
		return this._color;
	}

	public get icon(): string {
		return this._icon;
	}

	public get aliases(): readonly string[] {
		return this._aliases;
	}

	public setColor(color: string): void {
		if (this.isComplex) return;
		this._color = color;
		this.save();
	}

	public setIcon(icon: string): void {
		if (this.isComplex) return;
		this._icon = icon;
		this.save();
	}

	public addAlias(raw: string): EditResult {
		const alias = raw.trim().toLowerCase();
		if (!alias) return { ok: false, reason: 'empty', message: '' };
		if (this._aliases.includes(alias)) return { ok: false, reason: 'exists', message: `Alias '${alias}' already added.` };
		if (alias === this.callout.id) {
			return { ok: false, reason: 'invalid', message: `Callout '${alias}' cannot be an alias of itself.` };
		}
		if (!isValidCalloutId(alias)) return { ok: false, reason: 'invalid', message: `Invalid alias: '${alias}'.` };
		return this.commitAliases([...this._aliases, alias]);
	}

	public removeAlias(alias: string): EditResult {
		return this.commitAliases(this._aliases.filter((a) => a !== alias));
	}

	public rename(raw: string): EditResult {
		const normalized = normalizeCalloutId(raw);
		if (!normalized.ok) return normalized;
		if (normalized.id === this.callout.id) return { ok: false, reason: 'unchanged', message: '' };
		if (this.store.hasCallout(normalized.id)) {
			return { ok: false, reason: 'exists', message: `Callout '${normalized.id}' already exists.` };
		}
		return this.attempt(() => this.store.renameCustomCallout(this.callout.id, normalized.id), 'list');
	}

	public remove(): EditResult {
		return this.attempt(() => this.store.removeCustomCallout(this.callout.id), 'list');
	}

	private save(): void {
		this.store.setCalloutSettings(this.callout.id, unifiedAppearanceToSettings(this._color, this._icon));
	}

	private commitAliases(aliases: string[]): EditResult {
		const result = this.attempt(() => this.store.setAliasGroup(this.callout.id, aliases), 'row');
		if (!result.ok) return result;
		this._aliases = aliases;
		// Search matches alias text, so with a filter active an alias edit can change which rows
		// are visible. Without one, this row re-rendering its chips is enough.
		return { ok: true, changed: this.isFiltering() ? 'list' : 'row' };
	}

	private attempt(action: () => void, changed: Changed): EditResult {
		try {
			action();
		} catch (error) {
			return { ok: false, reason: 'failed', message: error instanceof Error ? error.message : String(error) };
		}
		return { ok: true, changed };
	}
}
