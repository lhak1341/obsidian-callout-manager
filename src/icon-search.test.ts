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

	test('"-" and "_" in a name count as spaces, so a spaced query finds it', () => {
		expect(rankIconSuggestions('arrow right', ['arrow-right', 'arrow-left', 'arrow_right_alt'])).toEqual(['arrow-right', 'arrow_right_alt']);
		expect(rankIconSuggestions('arrow-right', ['arrow right'])).toEqual(['arrow right']);
	});

	test('ranks the exact name first, then names starting with it, then names containing it', () => {
		expect(rankIconSuggestions('home', ['smart-home', 'home-storage', 'home', 'house'])).toEqual(['home', 'home-storage', 'smart-home']);
	});

	test('inside the containing tier an earlier match ranks first', () => {
		expect(rankIconSuggestions('ar', ['aaa-ar', 'zz-ar'])).toEqual(['zz-ar', 'aaa-ar']);
	});

	test('every word must match, in any order, with phrase matches ranked first', () => {
		const names = ['arrow-right', 'right-arrow-alt', 'arrow-left', 'right'];
		expect(rankIconSuggestions('arrow right', names)).toEqual(['arrow-right', 'right-arrow-alt']);
		expect(rankIconSuggestions('right arrow', names)).toEqual(['right-arrow-alt', 'arrow-right']);
	});

	test('a word that matches nothing excludes the icon', () => {
		expect(rankIconSuggestions('arrow banana', ['arrow-right'])).toEqual([]);
	});

	test('words may be split between the name and its tags', () => {
		const getIconTags = (name: string) => ({ 'plane-takeoff': ['flight', 'airport'] })[name] ?? [];
		expect(rankIconSuggestions('plane flight', ['plane-takeoff', 'plane'], getIconTags)).toEqual(['plane-takeoff']);
	});

	test('multi-word tags match, and tag-only matches rank after every name match', () => {
		const getIconTags = (name: string) => ({ 'a-arrow-down': ['font size'], 'font-awesome': [] })[name] ?? [];
		expect(rankIconSuggestions('font size', ['a-arrow-down', 'font-awesome'], getIconTags)).toEqual(['a-arrow-down']);
		expect(rankIconSuggestions('font', ['a-arrow-down', 'font-awesome'], getIconTags)).toEqual(['font-awesome', 'a-arrow-down']);
	});

	test('a word found in neither the name nor a tag excludes the icon, tags or not', () => {
		const getIconTags = () => ['flight', 'airport'];
		expect(rankIconSuggestions('plane banana', ['plane-takeoff'], getIconTags)).toEqual([]);
		expect(rankIconSuggestions('plane flight banana', ['plane-takeoff'], getIconTags)).toEqual([]);
	});

	test('tags match case-insensitively, whatever their separators', () => {
		const getIconTags = () => ['Font_Size', 'large-text'];
		expect(rankIconSuggestions('font size', ['a-arrow-down'], getIconTags)).toEqual(['a-arrow-down']);
		expect(rankIconSuggestions('large text', ['a-arrow-down'], getIconTags)).toEqual(['a-arrow-down']);
	});

	test('ignores case and extra whitespace in the query', () => {
		expect(rankIconSuggestions('  ARROW   Right ', ['arrow-right'])).toEqual(['arrow-right']);
	});

	test('a query of only separators returns every name', () => {
		expect(rankIconSuggestions(' - _ ', ['a', 'b'])).toEqual(['a', 'b']);
	});

	test('never returns a name twice', () => {
		const getIconTags = () => ['car', 'auto'];
		expect(rankIconSuggestions('car', ['car', 'cart'], getIconTags)).toEqual(['car', 'cart']);
	});
});
