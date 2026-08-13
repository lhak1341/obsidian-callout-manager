import { App } from 'obsidian';
import { describe, expect, jest, test } from '@jest/globals';

import { CalloutRepository } from './callout-repository';
import { defaultSettings } from './settings';

function makeRepository() {
	const resolve = jest.fn((id: string) => ({ color: `color-${id}`, icon: `icon-${id}` }));
	const onSave = jest.fn();
	const onCalloutChanged = jest.fn();
	const repository = new CalloutRepository(
		{} as App,
		defaultSettings(),
		resolve,
		onSave,
		onCalloutChanged,
	);
	return { repository, resolve, onSave, onCalloutChanged };
}

describe('CalloutRepository.createCustomCallout', () => {
	test('creates a callout with a valid id', () => {
		const { repository } = makeRepository();
		repository.createCustomCallout('note');
		expect(repository.hasCallout('note')).toBe(true);
	});

	test('rejects an invalid-shape id', () => {
		const { repository } = makeRepository();
		expect(() => repository.createCustomCallout('Not Valid!')).toThrow(/invalid callout id/i);
		expect(repository.hasCallout('Not Valid!')).toBe(false);
	});

	test('creating over an existing id is idempotent (repo layer has no duplicate check; UI enforces it)', () => {
		const { repository } = makeRepository();
		repository.createCustomCallout('note');
		expect(() => repository.createCustomCallout('note')).not.toThrow();
		expect(repository.getCallouts().filter((c) => c.id === 'note')).toHaveLength(1);
	});
});

describe('CalloutRepository.renameCustomCallout', () => {
	test('renames to a valid id', () => {
		const { repository } = makeRepository();
		repository.createCustomCallout('note');
		repository.renameCustomCallout('note', 'reminder');
		expect(repository.hasCallout('note')).toBe(false);
		expect(repository.hasCallout('reminder')).toBe(true);
	});

	test('rejects an invalid-shape new id', () => {
		const { repository } = makeRepository();
		repository.createCustomCallout('note');
		expect(() => repository.renameCustomCallout('note', 'Not Valid!')).toThrow(/invalid callout id/i);
		expect(repository.hasCallout('note')).toBe(true);
	});

	test('rejects renaming a callout that does not exist', () => {
		const { repository } = makeRepository();
		expect(() => repository.renameCustomCallout('missing', 'reminder')).toThrow(/does not exist/i);
	});

	test('rejects renaming onto an id that already exists', () => {
		const { repository } = makeRepository();
		repository.createCustomCallout('note');
		repository.createCustomCallout('reminder');
		expect(() => repository.renameCustomCallout('note', 'reminder')).toThrow(/already exists/i);
	});
});
