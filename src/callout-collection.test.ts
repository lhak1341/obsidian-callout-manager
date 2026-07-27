import { describe, expect, jest, test } from '@jest/globals';

import { CalloutCollection } from './callout-collection';

function makeCollection() {
	const resolver = jest.fn((id: string) => ({ id, color: `color-${id}`, icon: `icon-${id}` }));
	const collection = new CalloutCollection(resolver);
	return { collection, resolver };
}

describe('CalloutCollection — resolving and caching', () => {
	test('get() resolves a callout once and reuses the cache on repeated access', () => {
		const { collection, resolver } = makeCollection();
		collection.builtin.set(['note']);

		collection.get('note');
		collection.get('note');
		collection.get('note');

		expect(resolver).toHaveBeenCalledTimes(1);
	});

	test('invalidate() forces exactly one more resolve on next access', () => {
		const { collection, resolver } = makeCollection();
		collection.builtin.set(['note']);
		collection.get('note');
		expect(resolver).toHaveBeenCalledTimes(1);

		collection.invalidate('note');
		collection.get('note');
		collection.get('note');

		expect(resolver).toHaveBeenCalledTimes(2);
	});

	test('values() resolves all invalidated callouts in one pass', () => {
		const { collection, resolver } = makeCollection();
		collection.builtin.set(['note', 'warning']);

		const callouts = collection.values();

		expect(resolver).toHaveBeenCalledTimes(2);
		expect(callouts.map((c) => c.id).sort()).toStrictEqual(['note', 'warning']);
	});

	test('has() and keys() do not force a resolve', () => {
		const { collection, resolver } = makeCollection();
		collection.builtin.set(['note']);

		expect(collection.has('note')).toBe(true);
		expect(collection.keys()).toStrictEqual(['note']);
		expect(resolver).not.toHaveBeenCalled();
	});

	test('get() returns undefined for an unknown callout', () => {
		const { collection } = makeCollection();
		expect(collection.get('missing')).toBeUndefined();
	});
});

describe('CalloutCollection — multi-source overlap', () => {
	test('a callout present via two sources survives removal from one', () => {
		const { collection } = makeCollection();
		collection.builtin.set(['note']);
		collection.custom.add('note');

		collection.builtin.set([]);

		expect(collection.has('note')).toBe(true);
	});

	test('a callout disappears only when the last source is removed', () => {
		const { collection } = makeCollection();
		collection.builtin.set(['note']);
		collection.custom.add('note');

		collection.builtin.set([]);
		collection.custom.delete('note');

		expect(collection.has('note')).toBe(false);
	});

	test('returned Callout.sources reflects every active source', () => {
		const { collection } = makeCollection();
		collection.builtin.set(['note']);
		collection.custom.add('note');

		const callout = collection.get('note');

		expect(callout?.sources).toStrictEqual(
			expect.arrayContaining([{ type: 'builtin' }, { type: 'custom' }]),
		);
		expect(callout?.sources).toHaveLength(2);
	});
});

describe('CalloutCollection — hasChanged()', () => {
	test('returns false until a source changes, true after', () => {
		const { collection } = makeCollection();
		collection.builtin.set(['note']);
		collection.values();

		const changed = collection.hasChanged();
		expect(changed()).toBe(false);

		collection.builtin.set(['note', 'warning']);
		expect(changed()).toBe(true);
	});
});

describe('CalloutCollection.builtin — generic diff-based invalidation', () => {
	test('set() adds new callouts and they become visible', () => {
		const { collection } = makeCollection();
		collection.builtin.set(['note']);
		expect(collection.keys()).toStrictEqual(['note']);
	});

	test('set() with a removed id drops that callout from the collection', () => {
		const { collection } = makeCollection();
		collection.builtin.set(['note', 'warning']);
		collection.builtin.set(['note']);
		expect(collection.keys().sort()).toStrictEqual(['note']);
	});

	test('set() with an unchanged id invalidates it for re-resolve, not add/remove', () => {
		const { collection, resolver } = makeCollection();
		collection.builtin.set(['note']);
		collection.get('note');
		expect(resolver).toHaveBeenCalledTimes(1);

		collection.builtin.set(['note']);
		collection.get('note');

		expect(resolver).toHaveBeenCalledTimes(2);
		expect(collection.keys()).toStrictEqual(['note']);
	});
});

describe('CalloutCollection.theme — switch vs same-theme update', () => {
	test('setting the same theme twice diffs against the previous callout list', () => {
		const { collection } = makeCollection();
		collection.theme.set('Minimal', ['note']);
		collection.theme.set('Minimal', ['note', 'warning']);

		expect(collection.keys().sort()).toStrictEqual(['note', 'warning']);
	});

	test('switching to a different theme removes the old theme callouts and adds the new ones', () => {
		const { collection } = makeCollection();
		collection.theme.set('Minimal', ['old-note']);
		collection.get('old-note');

		collection.theme.set('California Coast', ['new-note']);

		expect(collection.has('old-note')).toBe(false);
		expect(collection.has('new-note')).toBe(true);
	});

	test('a callout kept across a theme switch under a different source survives', () => {
		const { collection } = makeCollection();
		collection.theme.set('Minimal', ['note']);
		collection.custom.add('note');

		collection.theme.set('California Coast', []);

		expect(collection.has('note')).toBe(true);
	});
});

describe('CalloutCollection.custom — explicit add/delete', () => {
	test('add() introduces new callouts; re-adding an existing id is a no-op invalidation-wise', () => {
		const { collection, resolver } = makeCollection();
		collection.custom.add('note');
		collection.get('note');
		expect(resolver).toHaveBeenCalledTimes(1);

		collection.custom.add('note');
		collection.get('note');

		expect(resolver).toHaveBeenCalledTimes(1);
	});

	test('delete() removes the callout', () => {
		const { collection } = makeCollection();
		collection.custom.add('note');
		collection.custom.delete('note');

		expect(collection.has('note')).toBe(false);
	});
});

describe('CalloutCollection.snippets — per-snippet-ID keying', () => {
	test('callouts from different snippets are tracked independently', () => {
		const { collection } = makeCollection();
		collection.snippets.set('snippet-a', ['note']);
		collection.snippets.set('snippet-b', ['warning']);

		expect(collection.keys().sort()).toStrictEqual(['note', 'warning']);
	});

	test('deleting one snippet only removes its own callouts', () => {
		const { collection } = makeCollection();
		collection.snippets.set('snippet-a', ['note']);
		collection.snippets.set('snippet-b', ['warning']);

		collection.snippets.delete('snippet-a');

		expect(collection.keys().sort()).toStrictEqual(['warning']);
	});
});
