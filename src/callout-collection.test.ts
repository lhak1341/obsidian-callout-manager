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
		collection.add('note');

		collection.get('note');
		collection.get('note');
		collection.get('note');

		expect(resolver).toHaveBeenCalledTimes(1);
	});

	test('invalidate() forces exactly one more resolve on next access', () => {
		const { collection, resolver } = makeCollection();
		collection.add('note');
		collection.get('note');
		expect(resolver).toHaveBeenCalledTimes(1);

		collection.invalidate('note');
		collection.get('note');
		collection.get('note');

		expect(resolver).toHaveBeenCalledTimes(2);
	});

	test('values() resolves all invalidated callouts in one pass', () => {
		const { collection, resolver } = makeCollection();
		collection.add('note', 'warning');

		const callouts = collection.values();

		expect(resolver).toHaveBeenCalledTimes(2);
		expect(callouts.map((c) => c.id).sort()).toStrictEqual(['note', 'warning']);
	});

	test('has() and keys() do not force a resolve', () => {
		const { collection, resolver } = makeCollection();
		collection.add('note');

		expect(collection.has('note')).toBe(true);
		expect(collection.keys()).toStrictEqual(['note']);
		expect(resolver).not.toHaveBeenCalled();
	});

	test('get() returns undefined for an unknown callout', () => {
		const { collection } = makeCollection();
		expect(collection.get('missing')).toBeUndefined();
	});
});

describe('CalloutCollection — hasChanged()', () => {
	test('returns false until the collection changes, true after', () => {
		const { collection } = makeCollection();
		collection.add('note');
		collection.values();

		const changed = collection.hasChanged();
		expect(changed()).toBe(false);

		collection.add('warning');
		expect(changed()).toBe(true);
	});

	test('re-adding an existing id does not count as a change', () => {
		const { collection } = makeCollection();
		collection.add('note');

		const changed = collection.hasChanged();
		collection.add('note');

		expect(changed()).toBe(false);
	});
});

describe('CalloutCollection.add()/delete()', () => {
	test('add() introduces new callouts; re-adding an existing id is a no-op invalidation-wise', () => {
		const { collection, resolver } = makeCollection();
		collection.add('note');
		collection.get('note');
		expect(resolver).toHaveBeenCalledTimes(1);

		collection.add('note');
		collection.get('note');

		expect(resolver).toHaveBeenCalledTimes(1);
	});

	test('add() accepts multiple ids at once', () => {
		const { collection } = makeCollection();
		collection.add('note', 'warning');

		expect(collection.keys().sort()).toStrictEqual(['note', 'warning']);
	});

	test('delete() removes the callout', () => {
		const { collection } = makeCollection();
		collection.add('note');
		collection.delete('note');

		expect(collection.has('note')).toBe(false);
	});

	test('delete() on an unknown id is a no-op', () => {
		const { collection } = makeCollection();
		expect(() => collection.delete('missing')).not.toThrow();
		expect(collection.has('missing')).toBe(false);
	});
});
