import { describe, expect, test } from '@jest/globals';

import { rankIconSuggestions } from './icon-search';

const ICON_NAMES = ['calendar', 'calendar-range', 'camera', 'car', 'cat', 'cpu'];

describe('rankIconSuggestions', () => {
	test('ranks name matches by earliest match position, then alphabetically', () => {
		expect(rankIconSuggestions('ca', ICON_NAMES)).toEqual(['calendar', 'calendar-range', 'camera', 'car', 'cat']);
	});

	test('returns every name when the query is empty', () => {
		expect(rankIconSuggestions('', ICON_NAMES)).toEqual(ICON_NAMES);
	});

	test('falls back to tag matches, ranked after every name match', () => {
		const getIconTags = (name: string) =>
			({ 'flask-conical': ['lab', 'chemistry'], atom: ['chemistry', 'physics'], plane: ['flight'] })[name] ?? [];

		expect(rankIconSuggestions('chem', ['flask-conical', 'atom', 'plane'], getIconTags)).toEqual(['atom', 'flask-conical']);
	});

	test('never duplicates a name match as a tag match', () => {
		const getIconTags = (name: string) => ({ car: ['automobile'] })[name] ?? [];
		expect(rankIconSuggestions('car', ['car', 'cat'], getIconTags)).toEqual(['car']);
	});

	test('matches on name only when no tags lookup is passed (back-compat default)', () => {
		expect(rankIconSuggestions('chem', ['flask-conical'])).toEqual([]);
	});
});
