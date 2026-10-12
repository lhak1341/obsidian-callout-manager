import { Events, Plugin, RGB } from 'obsidian';

import { getColorFromCallout, getTitleFromCallout } from '&callout-util';

import { Callout, CalloutManager } from '../api';
import { CalloutManagerEvent, CalloutManagerEventListener } from '../api/events';
import { CalloutReader } from './callout-store';

export class CalloutManagerAPI_V1 implements CalloutManager<true> {
	private readonly store: CalloutReader;
	private readonly consumer: Plugin | undefined;

	private readonly events: Events;

	public constructor(store: CalloutReader, consumer: Plugin | undefined) {
		this.store = store;
		this.consumer = consumer;
		this.events = new Events();
	}

	/** Tells this handle's listeners that callouts or their styles changed. Called by the host only. */
	public notifyChange(): void {
		this.events.trigger('change');
	}

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
		this.events.on(event, listener);
	}

	/** @override */
	public off<E extends CalloutManagerEvent>(event: E, listener: CalloutManagerEventListener<E>): void {
		this.assertHasConsumer();
		this.events.off(event, listener);
	}

	private assertHasConsumer(): void {
		if (this.consumer == null) {
			throw new Error('Cannot listen for events without an API consumer.');
		}
	}
}
