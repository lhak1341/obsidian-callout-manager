import Callout from '&callout';

import { getTitleFromCallout } from './callout-util';

export interface FilterAndSortCalloutsOptions {
	/** Alias groups keyed by canonical callout id. Alias text isn't matched when omitted. */
	aliasGroups?: Record<string, string[]>;

	/** How to order the result. Defaults to id order. */
	sortMode?: 'name' | 'color' | 'icon';
}

/**
 * Filters `callouts` by `query` (matched against id, title, and — if `aliasGroups` is given —
 * alias text, case-insensitively) and sorts the result. Defaults to id order; `color`/`icon` sort
 * modes fall back to id order to break ties.
 */
export function filterAndSortCallouts(
	callouts: readonly Callout[],
	query: string,
	options: FilterAndSortCalloutsOptions = {},
): Callout[] {
	const { aliasGroups, sortMode = 'name' } = options;
	const q = query.toLowerCase().trim();

	const list = q
		? callouts.filter(
				(c) =>
					c.id.toLowerCase().includes(q) ||
					getTitleFromCallout(c).toLowerCase().includes(q) ||
					(aliasGroups?.[c.id] ?? []).some((a) => a.toLowerCase().includes(q)),
			)
		: [...callouts];

	if (sortMode === 'color') {
		list.sort((a, b) => (a.color ?? '').localeCompare(b.color ?? '') || a.id.localeCompare(b.id));
	} else if (sortMode === 'icon') {
		list.sort((a, b) => (a.icon ?? '').localeCompare(b.icon ?? '') || a.id.localeCompare(b.id));
	} else {
		list.sort((a, b) => a.id.localeCompare(b.id));
	}

	return list;
}
