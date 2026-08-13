/**
 * Ranks icon names against a query: substring matches on the name itself
 * rank first (earliest match position, then alphabetically), followed by
 * matches found only in the icon's search tags/synonyms (e.g. "chem" ->
 * "flask-conical" via its "chemistry" tag), alphabetically. getIconTags
 * defaults to "no tags" so callers that don't have tag data still get the
 * old name-only behavior.
 */
export function rankIconSuggestions(query: string, iconNames: readonly string[], getIconTags: (name: string) => readonly string[] = () => []): string[] {
	const q = query.trim().toLowerCase();
	if (!q) return [...iconNames];

	const nameMatches = iconNames
		.map((name) => ({ name, idx: name.toLowerCase().indexOf(q) }))
		.filter((m) => m.idx !== -1)
		.sort((a, b) => (a.idx !== b.idx ? a.idx - b.idx : a.name.localeCompare(b.name)))
		.map((m) => m.name);

	const nameMatchSet = new Set(nameMatches);
	const tagMatches = iconNames
		.filter((name) => !nameMatchSet.has(name) && getIconTags(name).some((tag) => tag.toLowerCase().includes(q)))
		.sort((a, b) => a.localeCompare(b));

	return [...nameMatches, ...tagMatches];
}
