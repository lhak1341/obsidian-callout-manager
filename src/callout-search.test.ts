import { describe, expect, test } from '@jest/globals';

import Callout from '&callout';

import { filterAndSortCallouts } from './callout-search';

function makeCallout(id: string, color = '', icon = ''): Callout {
	return { id, color, icon };
}

const note = makeCallout('note', '#3079b0', 'lucide-pencil');
const warning = makeCallout('warning', '#e0a500', 'lucide-alert-triangle');
const bug = makeCallout('bug', '#e03030', 'lucide-bug');
const callouts = [note, warning, bug];

describe('filterAndSortCallouts', () => {
	test('defaults to id order when the query is empty', () => {
		expect(filterAndSortCallouts(callouts, '').map((c) => c.id)).toEqual(['bug', 'note', 'warning']);
	});

	test('matches on id, case-insensitively', () => {
		expect(filterAndSortCallouts(callouts, 'NOTE').map((c) => c.id)).toEqual(['note']);
	});

	test('matches on title', () => {
		// getTitleFromCallout('warning') -> 'Warning'
		expect(filterAndSortCallouts(callouts, 'warn').map((c) => c.id)).toEqual(['warning']);
	});

	test('does not match aliases when aliasGroups is omitted', () => {
		expect(filterAndSortCallouts(callouts, 'caution')).toEqual([]);
	});

	test('matches aliases when aliasGroups is given', () => {
		const aliasGroups = { warning: ['caution'] };
		expect(filterAndSortCallouts(callouts, 'caution', { aliasGroups }).map((c) => c.id)).toEqual(['warning']);
	});

	test('sorts by color, falling back to id to break ties', () => {
		const sameColor = [makeCallout('zzz', '#111'), makeCallout('aaa', '#111'), makeCallout('mid', '#000')];
		expect(filterAndSortCallouts(sameColor, '', { sortMode: 'color' }).map((c) => c.id)).toEqual([
			'mid',
			'aaa',
			'zzz',
		]);
	});

	test('sorts by icon, falling back to id to break ties', () => {
		const sameIcon = [makeCallout('zzz', '', 'a'), makeCallout('aaa', '', 'a'), makeCallout('mid', '', 'b')];
		expect(filterAndSortCallouts(sameIcon, '', { sortMode: 'icon' }).map((c) => c.id)).toEqual([
			'aaa',
			'zzz',
			'mid',
		]);
	});

	test('does not mutate the input array', () => {
		const input = [warning, bug, note];
		const copy = [...input];
		filterAndSortCallouts(input, '');
		expect(input).toEqual(copy);
	});
});
