import type { App } from 'obsidian';
import type { Plugin } from 'obsidian';
import { describe, expect, jest, test } from '@jest/globals';

import { Callout } from '&callout';

import { CalloutManagerAPIs } from './apis';
import { CalloutChangeSource, CalloutReader } from './callout-store';

function makeStoreStub(callouts: Callout[] = []): CalloutReader & CalloutChangeSource & { fireChange(): void } {
	const listeners: Set<() => void> = new Set();
	return {
		app: {} as App,
		getCallouts: () => callouts,
		hasCallout: (id) => callouts.some((c) => c.id === id),
		getCalloutSettings: () => undefined,
		subscribe: (listener) => {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		fireChange: () => listeners.forEach((l) => l()),
	};
}

function makeAttachedApis() {
	const store = makeStoreStub();
	const apis = new CalloutManagerAPIs();
	apis.attach(store);
	return { apis, store };
}

function makeFakePlugin(): Plugin {
	return { register: jest.fn() } as unknown as Plugin;
}

describe('CalloutManagerAPIs', () => {
	describe('ready gate', () => {
		test('newHandle stays pending until a store is attached', async () => {
			const apis = new CalloutManagerAPIs();
			const onSettled = jest.fn();
			const pending = apis.newHandle('v1', undefined, jest.fn()).then(onSettled);

			await Promise.resolve();
			await Promise.resolve();
			expect(onSettled).not.toHaveBeenCalled();

			apis.attach(makeStoreStub());
			await pending;
			expect(onSettled).toHaveBeenCalledTimes(1);
		});
	});

	describe('newHandle — unowned (consumerPlugin == null)', () => {
		test('returns a handle', async () => {
			const { apis } = makeAttachedApis();
			const handle = await apis.newHandle('v1', undefined, jest.fn());
			expect(handle).toBeDefined();
		});

		test('does not cache — each call returns a distinct handle', async () => {
			const { apis } = makeAttachedApis();
			const a = await apis.newHandle('v1', undefined, jest.fn());
			const b = await apis.newHandle('v1', undefined, jest.fn());
			expect(a).not.toBe(b);
		});
	});

	describe('newHandle — owned (consumerPlugin set)', () => {
		test('registers the cleanup function on the consumer plugin', async () => {
			const { apis } = makeAttachedApis();
			const plugin = makeFakePlugin();
			const cleanup = jest.fn();

			await apis.newHandle('v1', plugin, cleanup);

			expect(plugin.register).toHaveBeenCalledWith(cleanup);
		});

		test('reuses the existing handle for the same plugin, without re-registering', async () => {
			const { apis } = makeAttachedApis();
			const plugin = makeFakePlugin();

			const a = await apis.newHandle('v1', plugin, jest.fn());
			const b = await apis.newHandle('v1', plugin, jest.fn());

			expect(a).toBe(b);
			expect(plugin.register).toHaveBeenCalledTimes(1);
		});

		test('gives different plugins different handles', async () => {
			const { apis } = makeAttachedApis();

			const a = await apis.newHandle('v1', makeFakePlugin(), jest.fn());
			const b = await apis.newHandle('v1', makeFakePlugin(), jest.fn());

			expect(a).not.toBe(b);
		});
	});

	describe('destroyHandle', () => {
		test('removes the handle, so the next newHandle creates and re-registers a new one', async () => {
			const { apis } = makeAttachedApis();
			const plugin = makeFakePlugin();

			const handle = await apis.newHandle('v1', plugin, jest.fn());
			apis.destroyHandle('v1', plugin);

			const cleanup = jest.fn();
			const rehandle = await apis.newHandle('v1', plugin, cleanup);
			expect(rehandle).not.toBe(handle);
			expect(plugin.register).toHaveBeenCalledWith(cleanup);
		});

		test('a destroyed handle no longer receives change events', async () => {
			const { apis, store } = makeAttachedApis();
			const plugin = makeFakePlugin();
			const handle = await apis.newHandle('v1', plugin, jest.fn());
			const listener = jest.fn();
			handle.on('change', listener);

			apis.destroyHandle('v1', plugin);
			store.fireChange();

			expect(listener).not.toHaveBeenCalled();
		});

		test('is a no-op for a plugin with no handle', () => {
			const { apis } = makeAttachedApis();
			expect(() => apis.destroyHandle('v1', makeFakePlugin())).not.toThrow();
		});
	});

	describe('change events', () => {
		test('a store change reaches the listeners of every owned handle', async () => {
			const { apis, store } = makeAttachedApis();
			const handleA = await apis.newHandle('v1', makeFakePlugin(), jest.fn());
			const handleB = await apis.newHandle('v1', makeFakePlugin(), jest.fn());
			const listenerA = jest.fn();
			const listenerB = jest.fn();
			handleA.on('change', listenerA);
			handleB.on('change', listenerB);

			store.fireChange();

			expect(listenerA).toHaveBeenCalledTimes(1);
			expect(listenerB).toHaveBeenCalledTimes(1);
		});

		test('does not throw with no registered handles', () => {
			const { store } = makeAttachedApis();
			expect(() => store.fireChange()).not.toThrow();
		});
	});

	describe('assertV1 (invalid API version)', () => {
		test('newHandle throws for an unsupported version, even before attach', async () => {
			const apis = new CalloutManagerAPIs();
			await expect(apis.newHandle('bogus' as unknown as 'v1', undefined, jest.fn())).rejects.toThrow(
				'Unsupported Callout Manager API: bogus',
			);
		});

		test('destroyHandle throws for an unsupported version', () => {
			const { apis } = makeAttachedApis();
			expect(() => apis.destroyHandle('bogus' as unknown as 'v1', makeFakePlugin())).toThrow(
				'Unsupported Callout Manager API: bogus',
			);
		});
	});
});
