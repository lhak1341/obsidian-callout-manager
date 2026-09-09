import type { App } from 'obsidian';
import type { Plugin } from 'obsidian';
import { describe, expect, jest, test } from '@jest/globals';

import { Callout } from '&callout';

import { destroy, emitter } from './api-common';
import { CalloutManagerAPIs } from './apis';
import { CalloutReader } from './callout-store';

function makeReaderStub(callouts: Callout[] = []): CalloutReader {
	return {
		app: {} as App,
		getCallouts: () => callouts,
		hasCallout: (id) => callouts.some((c) => c.id === id),
		getCalloutSettings: () => undefined,
	};
}

function makeFakePlugin(): Plugin {
	return { register: jest.fn() } as unknown as Plugin;
}

describe('CalloutManagerAPIs', () => {
	describe('newHandle — unowned (consumerPlugin == null)', () => {
		test('returns a handle', async () => {
			const apis = new CalloutManagerAPIs(makeReaderStub());
			const handle = await apis.newHandle('v1', undefined, jest.fn());
			expect(handle).toBeDefined();
		});

		test('does not cache — each call returns a distinct handle', async () => {
			const apis = new CalloutManagerAPIs(makeReaderStub());
			const a = await apis.newHandle('v1', undefined, jest.fn());
			const b = await apis.newHandle('v1', undefined, jest.fn());
			expect(a).not.toBe(b);
		});
	});

	describe('newHandle — owned (consumerPlugin set)', () => {
		test('registers the cleanup function on the consumer plugin', async () => {
			const apis = new CalloutManagerAPIs(makeReaderStub());
			const plugin = makeFakePlugin();
			const cleanup = jest.fn();

			await apis.newHandle('v1', plugin, cleanup);

			expect(plugin.register).toHaveBeenCalledWith(cleanup);
		});

		test('reuses the existing handle for the same plugin, without re-registering', async () => {
			const apis = new CalloutManagerAPIs(makeReaderStub());
			const plugin = makeFakePlugin();

			const a = await apis.newHandle('v1', plugin, jest.fn());
			const b = await apis.newHandle('v1', plugin, jest.fn());

			expect(a).toBe(b);
			expect(plugin.register).toHaveBeenCalledTimes(1);
		});

		test('gives different plugins different handles', async () => {
			const apis = new CalloutManagerAPIs(makeReaderStub());
			const pluginA = makeFakePlugin();
			const pluginB = makeFakePlugin();

			const a = await apis.newHandle('v1', pluginA, jest.fn());
			const b = await apis.newHandle('v1', pluginB, jest.fn());

			expect(a).not.toBe(b);
		});
	});

	describe('destroyHandle', () => {
		test('calls the handle destroy hook and removes it from the map', async () => {
			const apis = new CalloutManagerAPIs(makeReaderStub());
			const plugin = makeFakePlugin();

			const handle = await apis.newHandle('v1', plugin, jest.fn());
			const destroySpy = jest.spyOn(handle, destroy);

			apis.destroyHandle('v1', plugin);
			expect(destroySpy).toHaveBeenCalledTimes(1);

			// A fresh newHandle for the same plugin must create (and re-register) a new instance.
			const cleanup = jest.fn();
			const rehandle = await apis.newHandle('v1', plugin, cleanup);
			expect(rehandle).not.toBe(handle);
			expect(plugin.register).toHaveBeenCalledWith(cleanup);
		});

		test('is a no-op for a plugin with no handle', () => {
			const apis = new CalloutManagerAPIs(makeReaderStub());
			const plugin = makeFakePlugin();

			expect(() => apis.destroyHandle('v1', plugin)).not.toThrow();
		});
	});

	describe('emitEventForCalloutChange', () => {
		test('triggers "change" on every registered handle', async () => {
			const apis = new CalloutManagerAPIs(makeReaderStub());
			const handleA = await apis.newHandle('v1', makeFakePlugin(), jest.fn());
			const handleB = await apis.newHandle('v1', makeFakePlugin(), jest.fn());

			const triggerA = jest.spyOn(handleA[emitter], 'trigger');
			const triggerB = jest.spyOn(handleB[emitter], 'trigger');

			apis.emitEventForCalloutChange();

			expect(triggerA).toHaveBeenCalledWith('change');
			expect(triggerB).toHaveBeenCalledWith('change');
		});

		test('does not throw with no registered handles', () => {
			const apis = new CalloutManagerAPIs(makeReaderStub());
			expect(() => apis.emitEventForCalloutChange()).not.toThrow();
		});
	});

	describe('assertV1 (invalid API version)', () => {
		test('newHandle throws for an unsupported version', async () => {
			const apis = new CalloutManagerAPIs(makeReaderStub());
			await expect(apis.newHandle('bogus' as unknown as 'v1', undefined, jest.fn())).rejects.toThrow(
				'Unsupported Callout Manager API: bogus',
			);
		});

		test('destroyHandle throws for an unsupported version', () => {
			const apis = new CalloutManagerAPIs(makeReaderStub());
			const plugin = makeFakePlugin();
			expect(() => apis.destroyHandle('bogus' as unknown as 'v1', plugin)).toThrow(
				'Unsupported Callout Manager API: bogus',
			);
		});
	});
});
