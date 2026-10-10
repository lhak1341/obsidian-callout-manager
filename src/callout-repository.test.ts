import { App } from 'obsidian';
import { describe, expect, jest, test } from '@jest/globals';

import { CalloutRepository } from './callout-repository';
import { defaultSettings } from './settings';

function makeRepository() {
	const getCalloutProperties = jest.fn((id: string) => ({ color: `color-${id}`, icon: `icon-${id}` }));
	const reloadStyles = jest.fn();
	const setCss = jest.fn();
	const save = jest.fn();
	const onChange = jest.fn();
	const repository = new CalloutRepository({} as App, defaultSettings(), {
		probe: { getCalloutProperties, reloadStyles },
		sink: { setCss },
		environment: () => ({ theme: '<default>', colorScheme: 'dark' }),
		save,
		onChange,
	});
	return { repository, resolve: getCalloutProperties, reloadStyles, setCss, save, onChange, onCalloutChanged: onChange };
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

	test('moves existing settings to the new id and leaves none behind when there were none', () => {
		const { repository } = makeRepository();
		repository.createCustomCallout('note');
		repository.createCustomCallout('plain');
		repository.setCalloutSettings('note', [{ changes: { color: '#ff0000' } }] as never);
		repository.renameCustomCallout('note', 'reminder');
		repository.renameCustomCallout('plain', 'plain2');
		expect(repository.getCalloutSettings('reminder')).toBeDefined();
		expect(repository.getCalloutSettings('note')).toBeUndefined();
		expect(repository.getCalloutSettings('plain2')).toBeUndefined();
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

describe('CalloutRepository cache invalidation', () => {
	function seeded() {
		const ctx = makeRepository();
		ctx.repository.createCustomCallout('note');
		ctx.repository.createCustomCallout('alias');
		ctx.repository.getCallouts(); // warm the cache
		ctx.resolve.mockClear();
		ctx.onCalloutChanged.mockClear();
		return ctx;
	}

	test('setCalloutSettings re-resolves the edited callout', () => {
		const { repository, resolve } = seeded();
		repository.setCalloutSettings('note', [{ changes: { color: '#ff0000' } }] as never);
		repository.getCallouts();
		expect(resolve).toHaveBeenCalledWith('note');
	});

	test('setCalloutSettings re-resolves aliases that inherit from the edited callout', () => {
		const { repository, resolve } = seeded();
		repository.setAliasGroup('note', ['alias']);
		resolve.mockClear();
		repository.setCalloutSettings('note', [{ changes: { color: '#ff0000' } }] as never);
		repository.getCallouts();
		expect(resolve).toHaveBeenCalledWith('alias');
	});

	test('setAliasGroup re-resolves callouts and notifies consumers', () => {
		const { repository, resolve, onCalloutChanged } = seeded();
		repository.setAliasGroup('note', ['alias']);
		repository.getCallouts();
		expect(resolve).toHaveBeenCalledWith('alias');
		expect(onCalloutChanged).toHaveBeenCalled();
	});

	test('setIconColorAdjust re-resolves callouts and notifies consumers', () => {
		const { repository, resolve, onCalloutChanged } = seeded();
		repository.setIconColorAdjust('dark', { saturation: 10, lightness: 0 });
		repository.getCallouts();
		expect(resolve).toHaveBeenCalledWith('note');
		expect(onCalloutChanged).toHaveBeenCalled();
	});
});

describe('CalloutRepository styles and environment', () => {
	test('seeds the style sink on construction', () => {
		const { setCss } = makeRepository();
		expect(setCss).toHaveBeenCalledTimes(1);
	});

	test('a settings change re-applies CSS, saves, and notifies once', () => {
		const { repository, setCss, save, onChange } = makeRepository();
		setCss.mockClear();
		repository.setCalloutSettings('note', [{ changes: { color: '#ff0000' } }] as never);
		expect(setCss).toHaveBeenCalledTimes(1);
		expect(save).toHaveBeenCalledTimes(1);
		expect(onChange).toHaveBeenCalledTimes(1);
	});

	test('environmentChanged reloads the probe before re-applying CSS, then invalidates and notifies', () => {
		const { repository, reloadStyles, setCss, resolve, onChange } = makeRepository();
		repository.createCustomCallout('note');
		repository.getCallouts();
		resolve.mockClear();
		setCss.mockClear();
		onChange.mockClear();
		repository.environmentChanged();
		expect(reloadStyles.mock.invocationCallOrder[0]).toBeLessThan(setCss.mock.invocationCallOrder[0]);
		repository.getCallouts();
		expect(resolve).toHaveBeenCalledWith('note');
		expect(onChange).toHaveBeenCalledTimes(1);
	});

	test('environmentChanged does not save settings', () => {
		const { repository, save } = makeRepository();
		save.mockClear();
		repository.environmentChanged();
		expect(save).not.toHaveBeenCalled();
	});
});

describe('CalloutRepository alias groups', () => {
	test('rename moves the alias group to the new id', () => {
		const { repository } = makeRepository();
		repository.createCustomCallout('note');
		repository.setAliasGroup('note', ['memo']);
		repository.renameCustomCallout('note', 'reminder');
		expect(repository.getAliasGroups().reminder).toStrictEqual(['memo']);
		expect(repository.getAliasGroups().note).toBeUndefined();
	});

	test('rename leaves other groups, and alias names inside them, untouched', () => {
		const { repository } = makeRepository();
		repository.createCustomCallout('note');
		repository.createCustomCallout('tip');
		repository.setAliasGroup('tip', ['note']);
		repository.renameCustomCallout('note', 'reminder');
		expect(repository.getAliasGroups().tip).toStrictEqual(['note']);
	});

	test('remove drops the alias group of the removed callout only', () => {
		const { repository } = makeRepository();
		repository.createCustomCallout('note');
		repository.createCustomCallout('tip');
		repository.setAliasGroup('note', ['memo']);
		repository.setAliasGroup('tip', ['note']);
		repository.removeCustomCallout('note');
		expect(repository.getAliasGroups().note).toBeUndefined();
		expect(repository.getAliasGroups().tip).toStrictEqual(['note']);
	});

	test('rename and remove re-apply CSS and save', () => {
		const { repository, save } = makeRepository();
		repository.createCustomCallout('note');
		repository.setAliasGroup('note', ['memo']);
		save.mockClear();
		repository.renameCustomCallout('note', 'reminder');
		repository.removeCustomCallout('reminder');
		expect(save).toHaveBeenCalledTimes(2);
	});

	test('setAliasGroup trims, lowercases and dedupes', () => {
		const { repository } = makeRepository();
		repository.setAliasGroup('note', [' Memo ', 'memo', 'jot']);
		expect(repository.getAliasGroups().note).toStrictEqual(['memo', 'jot']);
	});

	test('setAliasGroup rejects an invalid alias id and changes nothing', () => {
		const { repository, save } = makeRepository();
		save.mockClear();
		expect(() => repository.setAliasGroup('note', ['Not Valid!'])).toThrow(/invalid callout id/i);
		expect(repository.getAliasGroups().note).toBeUndefined();
		expect(save).not.toHaveBeenCalled();
	});

	test('setAliasGroup rejects an invalid canonical id', () => {
		const { repository } = makeRepository();
		expect(() => repository.setAliasGroup('Not Valid!', ['memo'])).toThrow(/invalid callout id/i);
	});

	test('setAliasGroup rejects aliasing a callout to itself', () => {
		const { repository } = makeRepository();
		expect(() => repository.setAliasGroup('note', ['note'])).toThrow(/itself/i);
	});

	test('setAliasGroup with an empty list removes the group', () => {
		const { repository } = makeRepository();
		repository.setAliasGroup('note', ['memo']);
		repository.setAliasGroup('note', []);
		expect(repository.getAliasGroups().note).toBeUndefined();
	});
});
