/**
 * Obsidian's built-in callout alias groups.
 * Key = canonical type; value = list of aliases that render identically.
 */
export const CALLOUT_ALIAS_GROUPS: Readonly<Record<string, readonly string[]>> = {
	abstract: ['summary', 'tldr'],
	tip:      ['hint', 'important'],
	success:  ['check', 'done'],
	question: ['help', 'faq'],
	warning:  ['caution', 'attention'],
	failure:  ['fail', 'missing'],
	danger:   ['error'],
	quote:    ['cite'],
};

/** Reverse map: alias ID → canonical ID */
export const CALLOUT_CANONICAL: Readonly<Record<string, string>> = Object.fromEntries(
	Object.entries(CALLOUT_ALIAS_GROUPS).flatMap(([canonical, aliases]) =>
		aliases.map((alias) => [alias, canonical]),
	),
);
