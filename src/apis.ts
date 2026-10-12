import { Plugin } from 'obsidian';

import { CalloutManager } from '../api';

import { CalloutManagerAPI_V1 } from './api-v1';
import { CalloutChangeSource, CalloutReader } from './callout-store';

/**
 * Hands out Callout Manager API handles to consumer plugins. Constructed at the start of the
 * plugin's `onload`, before the store exists; {@link newHandle} waits until {@link attach} gives
 * it one, because a consumer's `getApi()` can arrive before `onload` has finished.
 */
export class CalloutManagerAPIs {
	private readonly handles: Map<Plugin, CalloutManagerAPI_V1>;
	private store: CalloutReader | null = null;
	private open!: () => void;
	private readonly ready: Promise<void>;

	public constructor() {
		this.handles = new Map();
		this.ready = new Promise((resolve) => (this.open = resolve));
	}

	/** Supplies the store, forwards its change notifications to every handle, and releases waiting {@link newHandle} calls. */
	public attach(store: CalloutReader & CalloutChangeSource): void {
		this.store = store;
		store.subscribe(() => this.emitEventForCalloutChange());
		this.open();
	}

	/**
	 * Creates (or gets) an instance of the Callout Manager API for a plugin.
	 * If the plugin is undefined, only trivial functions are available.
	 *
	 * @param version The API version.
	 * @param consumerPlugin The plugin using the API.
	 *
	 * @internal
	 */
	public async newHandle(
		version: 'v1',
		consumerPlugin: Plugin | undefined,
		cleanupFunc: () => void,
	): Promise<CalloutManager> {
		this.assertV1(version);
		await this.ready;
		const store = this.store as CalloutReader;

		// If we aren't trying to create an owned handle, create and return an unowned one.
		if (consumerPlugin == null) {
			return new CalloutManagerAPI_V1(store, undefined);
		}

		// Otherwise, give back the owned handle for the plugin if we already have one.
		const existing = this.handles.get(consumerPlugin);
		if (existing != null) {
			return existing;
		}

		// Register the provided clean-up function on the consumer plugin.
		// When the consumer plugin unloads, the cleanup function will call `destroyApiHandle`.
		consumerPlugin.register(cleanupFunc);

		// Create a new handle.
		const handle = new CalloutManagerAPI_V1(store, consumerPlugin);
		this.handles.set(consumerPlugin, handle);
		return handle;
	}

	/**
	 * Destroys an API handle created by {@link newHandle}.
	 *
	 * @param version The API version.
	 * @param consumerPlugin The plugin using the API.
	 *
	 * @internal
	 */
	public destroyHandle(version: 'v1', consumerPlugin: Plugin) {
		this.assertV1(version);
		this.handles.delete(consumerPlugin);
	}

	private emitEventForCalloutChange() {
		for (const handle of this.handles.values()) {
			handle.notifyChange();
		}
	}

	// The sole API-version validator (the plugin's newApiHandle/destroyApiHandle just delegate
	// here). Keep this even though only 'v1' exists: api/index.ts's getApi() types `version` as a
	// bare string and crosses a real plugin-to-plugin boundary, so this is the one thing guarding
	// that external input.
	private assertV1(version: string): asserts version is 'v1' {
		if (version !== 'v1') throw new Error(`Unsupported Callout Manager API: ${version}`);
	}
}
