import { Events, Plugin, RGB } from 'obsidian';

import { getColorFromCallout, getTitleFromCallout } from '&callout-util';

import { Callout, CalloutManager } from '../api';
import { CalloutManagerEvent, CalloutManagerEventListener } from '../api/events';
import { CalloutReader } from './callout-store';
import { destroy, emitter } from './api-common';

export class CalloutManagerAPI_V1 implements CalloutManager<true> {
	private readonly store: CalloutReader;
	private readonly consumer: Plugin | undefined;

	public readonly [emitter]: Events;

	public constructor(store: CalloutReader, consumer: Plugin | undefined) {
		this.store = store;
		this.consumer = consumer;
		this[emitter] = new Events();

	}

	/**
	 * Called to destroy an API handle bound to a consumer.
	 */
	public [destroy]() {}

	/** @override */
	public getCallouts(): Readonly<Callout>[] {
		return this.store.getCallouts().map((callout) => Object.freeze({ ...callout }));
	}

	/** @override */
	public getColor(callout: Callout): RGB | { invalid: string } {
		const color = getColorFromCallout(callout);
		return color ?? { invalid: callout.color };
	}

	/** @override */
	public getTitle(callout: Callout): string {
		return getTitleFromCallout(callout);
	}

	/** @override */
	public on<E extends CalloutManagerEvent>(event: E, listener: CalloutManagerEventListener<E>): void {
		this.assertHasConsumer();
		this[emitter].on(event, listener);
	}

	/** @override */
	public off<E extends CalloutManagerEvent>(event: E, listener: CalloutManagerEventListener<E>): void {
		this.assertHasConsumer();
		this[emitter].off(event, listener);
	}

	private assertHasConsumer(): void {
		if (this.consumer == null) {
			throw new Error('Cannot listen for events without an API consumer.');
		}
	}
}
