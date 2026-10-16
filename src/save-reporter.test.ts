import { describe, expect, jest, test } from '@jest/globals';

import { SaveReporter } from './save-reporter';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

function make() {
	const notify = jest.fn();
	const log = jest.fn();
	return { notify, log, reporter: new SaveReporter(notify, log) };
}

describe('SaveReporter', () => {
	test('a successful save is silent', async () => {
		const { reporter, notify, log } = make();
		reporter.run(() => Promise.resolve());
		await settle();
		expect(notify).not.toHaveBeenCalled();
		expect(log).not.toHaveBeenCalled();
	});

	test('a rejected save notifies the user and is logged', async () => {
		const { reporter, notify, log } = make();
		const error = new Error('disk full');
		reporter.run(() => Promise.reject(error));
		await settle();
		expect(notify).toHaveBeenCalledTimes(1);
		expect(log).toHaveBeenCalledWith(error);
	});

	test('a synchronous throw is handled like a rejection', () => {
		const { reporter, notify, log } = make();
		reporter.run(() => {
			throw new Error('boom');
		});
		expect(notify).toHaveBeenCalledTimes(1);
		expect(log).toHaveBeenCalledTimes(1);
	});

	test('a failed synchronous save does not end the failure streak', () => {
		const { reporter, notify } = make();
		const boom = () => {
			throw new Error('boom');
		};
		reporter.run(boom);
		reporter.run(boom);
		expect(notify).toHaveBeenCalledTimes(1);
	});

	test('a streak of failures notifies once but logs every failure', async () => {
		const { reporter, notify, log } = make();
		for (let i = 0; i < 3; i++) reporter.run(() => Promise.reject(new Error(`fail ${i}`)));
		await settle();
		expect(notify).toHaveBeenCalledTimes(1);
		expect(log).toHaveBeenCalledTimes(3);
	});

	test('a success ends the streak, so the next failure notifies again', async () => {
		const { reporter, notify } = make();
		reporter.run(() => Promise.reject(new Error('a')));
		await settle();
		reporter.run(() => Promise.resolve());
		await settle();
		reporter.run(() => Promise.reject(new Error('b')));
		await settle();
		expect(notify).toHaveBeenCalledTimes(2);
	});

	test('a void save (no promise) counts as success', () => {
		const { reporter, notify } = make();
		reporter.run(() => undefined);
		expect(notify).not.toHaveBeenCalled();
	});
});
