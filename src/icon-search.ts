/** How well an icon answered the query; lower sorts first. */
const EXACT = 0; // the name is the query
const CONTAINS = 1; // the name contains the query; an earlier position ranks first, so a prefix leads
const NAME_WORDS = 2; // every word is in the name, but not as the phrase
const RELATED = 3; // every word is in the name or a tag, at least one only in a tag

/** Lowercases and turns every run of `-`, `_` and whitespace into one space: "arrow-right" ≙ "arrow right". */
const normalize = (text: string): string => text.toLowerCase().replace(/[-_\s]+/g, ' ').trim();

interface Match {
	name: string;
	tier: number;
	/** Where the phrase sits in the name, so an earlier hit ranks first inside the CONTAINS tier (position 0 is a prefix). */
	position: number;
}

/**
 * Ranks icon names against a query. The query's words must ALL match, so typing more narrows the
 * list; `-` and `_` in names count as spaces, so "arrow right" finds `arrow-right`. Order is by
 * tier (see the constants above), then by earliest position, then alphabetically. Tags are
 * search synonyms (e.g. "chem" -> `flask-conical` via "chemistry"); `getIconTags` defaults to
 * "no tags" so callers without tag data get name-only matching.
 */
export function rankIconSuggestions(
	query: string,
	iconNames: readonly string[],
	getIconTags: (name: string) => readonly string[] = () => [],
): string[] {
	const phrase = normalize(query);
	if (!phrase) return [...iconNames];
	const words = phrase.split(' ');

	const matches: Match[] = [];
	for (const name of iconNames) {
		const form = normalize(name);
		const match = matchName(name, form, phrase, words) ?? matchWithTags(name, form, words, getIconTags(name));
		if (match) matches.push(match);
	}

	return matches
		.sort((a, b) => a.tier - b.tier || a.position - b.position || a.name.localeCompare(b.name))
		.map((m) => m.name);
}

function matchName(name: string, form: string, phrase: string, words: string[]): Match | null {
	if (form === phrase) return { name, tier: EXACT, position: 0 };
	const position = form.indexOf(phrase);
	if (position !== -1) return { name, tier: CONTAINS, position };
	if (words.every((word) => form.includes(word))) return { name, tier: NAME_WORDS, position: 0 };
	return null;
}

function matchWithTags(name: string, form: string, words: string[], tags: readonly string[]): Match | null {
	if (tags.length === 0) return null;
	// Query words never contain a separator, so a tag needs lowercasing only, not the name treatment.
	const tagForms = tags.map((tag) => tag.toLowerCase());
	const found = words.every((word) => form.includes(word) || tagForms.some((tag) => tag.includes(word)));
	return found ? { name, tier: RELATED, position: 0 } : null;
}
