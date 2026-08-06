import type { Callout, CalloutID } from '../api';

/**
 * A collection of Callout IDs.
 *
 * Every callout tracked here is one the user created through this plugin — there is no
 * built-in/theme/snippet discovery (that was removed deliberately; see acea84d). `add`/`delete`
 * are the only way callouts enter or leave the cache.
 */
export class CalloutCollection {
	private resolver: (id: string) => Callout;

	private invalidated: Set<CachedCallout>;
	private invalidationCount: number;
	private cacheById: Map<CalloutID, CachedCallout>;

	public constructor(resolver: (id: string) => Callout) {
		this.resolver = resolver;
		this.invalidated = new Set();
		this.invalidationCount = 0;
		this.cacheById = new Map();
	}

	public get(id: CalloutID): Callout | undefined {
		const cached = this.cacheById.get(id);
		if (cached === undefined) {
			return undefined;
		}

		// Ensure the callout is resolved.
		if (this.invalidated.has(cached)) {
			this.resolveOne(cached);
		}

		// Return the callout.
		return cached.callout as Callout;
	}

	/**
	 * Checks if a callout with this ID is in the collection.
	 * @param id The callout ID.
	 * @returns True if the callout is in the collection.
	 */
	public has(id: CalloutID): boolean {
		return this.cacheById.has(id);
	}

	/**
	 * Gets all the known {@link CalloutID callout IDs}.
	 * @returns The callout IDs.
	 */
	public keys(): CalloutID[] {
		return Array.from(this.cacheById.keys());
	}

	/**
	 * Gets all the known {@link Callout callouts}.
	 * @returns The callouts.
	 */
	public values(): Callout[] {
		this.resolveAll();
		return Array.from(this.cacheById.values()).map((c) => c.callout as Callout);
	}

	/**
	 * Returns a function that will return `true` if the collection has changed since the function was created.
	 * @returns The function.
	 */
	public hasChanged(): () => boolean {
		const countSnapshot = this.invalidationCount;
		return () => this.invalidationCount !== countSnapshot;
	}

	/**
	 * Adds callouts to the collection.
	 * IDs that already exist are left as-is (not invalidated).
	 *
	 * @param ids The callout IDs.
	 */
	public add(...ids: CalloutID[]): void {
		let anyAdded = false;
		for (const id of ids) {
			if (!this.cacheById.has(id)) {
				const cached = new CachedCallout(id);
				this.cacheById.set(id, cached);
				this.invalidated.add(cached);
				anyAdded = true;
			}
		}

		if (anyAdded) {
			this.invalidationCount++;
		}
	}

	/**
	 * Removes callouts from the collection.
	 *
	 * @param ids The callout IDs.
	 */
	public delete(...ids: CalloutID[]): void {
		let anyRemoved = false;
		for (const id of ids) {
			const cached = this.cacheById.get(id);
			if (cached !== undefined) {
				this.cacheById.delete(id);
				this.invalidated.delete(cached);
				anyRemoved = true;
			}
		}

		if (anyRemoved) {
			this.invalidationCount++;
		}
	}

	/**
	 * Marks a callout as invalidated.
	 * This forces the callout to be resolved again.
	 *
	 * @param id The callout ID.
	 */
	public invalidate(id: CalloutID): void {
		const callout = this.cacheById.get(id);
		if (callout !== undefined) {
			this.invalidated.add(callout);
		}
	}

	/**
	 * Resolves the settings of a callout.
	 * This removes it from the set of invalidated callout caches.
	 *
	 * @param cached The callout's cache entry.
	 */
	protected resolveOne(cached: CachedCallout) {
		this.doResolve(cached);
		this.invalidated.delete(cached);
	}

	/**
	 * Resolves the settings of all callouts.
	 */
	protected resolveAll() {
		for (const cached of this.invalidated.values()) {
			this.doResolve(cached);
		}

		this.invalidated.clear();
	}

	protected doResolve(cached: CachedCallout) {
		cached.callout = this.resolver(cached.id);
	}
}

class CachedCallout {
	public readonly id: CalloutID;
	public callout: Callout | null;

	public constructor(id: CalloutID) {
		this.id = id;
		this.callout = null;
	}
}
