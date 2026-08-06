import { App } from 'obsidian';
import { describe, expect, test } from '@jest/globals';

import { Callout } from '&callout';

import { CalloutManagerAPI_V1 } from './api-v1';
import { CalloutReader } from './callout-store';

/**
 * A `CalloutReader`-only stub — no `AliasStore`/`IconColorAdjustStore`/CRUD methods.
 * If `CalloutManagerAPI_V1` ever starts depending on more than `CalloutReader`, this
 * won't type-check, catching the regression before it reaches a consumer plugin.
 */
function makeReaderStub(callouts: Callout[]): CalloutReader {
	return {
		app: {} as App,
		getCallouts: () => callouts,
		hasCallout: (id) => callouts.some((c) => c.id === id),
		getCalloutSettings: () => undefined,
	};
}

const note: Callout = {
	id: 'note',
	color: '#3079b0',
	icon: 'lucide-pencil',
};

describe('CalloutManagerAPI_V1 — CalloutReader-only dependency', () => {
	test('constructs and reads callouts from a CalloutReader-only stub', () => {
		const store = makeReaderStub([note]);
		const api = new CalloutManagerAPI_V1(store, undefined);

		expect(api.getCallouts()).toEqual([note]);
	});

	test('getCallouts() returns frozen copies, not live references', () => {
		const store = makeReaderStub([note]);
		const api = new CalloutManagerAPI_V1(store, undefined);

		const [returned] = api.getCallouts();
		expect(Object.isFrozen(returned)).toBe(true);
		expect(returned).not.toBe(note);
	});
});
