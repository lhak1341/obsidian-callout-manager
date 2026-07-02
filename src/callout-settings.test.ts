import { describe, expect, test } from '@jest/globals';

import { calloutSettingsToCSS, checkCondition } from '&callout-settings';

const dark = { theme: 'MyTheme', colorScheme: 'dark' as const };
const light = { theme: 'MyTheme', colorScheme: 'light' as const };
const other = { theme: 'OtherTheme', colorScheme: 'dark' as const };

describe('checkCondition', () => {
	test('undefined always passes', () => {
		expect(checkCondition(undefined, dark)).toBe(true);
		expect(checkCondition(undefined, light)).toBe(true);
	});

	test('theme condition matches exact theme', () => {
		expect(checkCondition({ theme: 'MyTheme' }, dark)).toBe(true);
		expect(checkCondition({ theme: 'MyTheme' }, light)).toBe(true);
		expect(checkCondition({ theme: 'MyTheme' }, other)).toBe(false);
		expect(checkCondition({ theme: 'OtherTheme' }, other)).toBe(true);
		expect(checkCondition({ theme: 'OtherTheme' }, dark)).toBe(false);
	});

	test('colorScheme condition matches exact scheme', () => {
		expect(checkCondition({ colorScheme: 'dark' }, dark)).toBe(true);
		expect(checkCondition({ colorScheme: 'dark' }, light)).toBe(false);
		expect(checkCondition({ colorScheme: 'light' }, light)).toBe(true);
	});

	test('or: true when at least one sub-condition passes', () => {
		expect(checkCondition({ or: [{ colorScheme: 'dark' }, { theme: 'OtherTheme' }] }, dark)).toBe(true);
		expect(checkCondition({ or: [{ colorScheme: 'light' }, { theme: 'OtherTheme' }] }, dark)).toBe(false);
	});

	test('or: false when no sub-condition passes', () => {
		expect(checkCondition({ or: [{ theme: 'X' }, { colorScheme: 'light' }] }, dark)).toBe(false);
	});

	test('and: true only when all sub-conditions pass', () => {
		expect(checkCondition({ and: [{ theme: 'MyTheme' }, { colorScheme: 'dark' }] }, dark)).toBe(true);
		expect(checkCondition({ and: [{ theme: 'MyTheme' }, { colorScheme: 'light' }] }, dark)).toBe(false);
	});

	test('and: false when any sub-condition fails', () => {
		expect(checkCondition({ and: [{ theme: 'MyTheme' }, { theme: 'OtherTheme' }] }, dark)).toBe(false);
	});

	test('nested: or inside and', () => {
		const condition = {
			and: [{ theme: 'MyTheme' }, { or: [{ colorScheme: 'dark' }, { colorScheme: 'light' }] }],
		};
		expect(checkCondition(condition, dark)).toBe(true);
		expect(checkCondition(condition, other)).toBe(false);
	});
});

describe('calloutSettingsToCSS', () => {
	test('empty settings returns empty string', () => {
		expect(calloutSettingsToCSS('info', [], dark)).toBe('');
	});

	test('unconditional setting always applies', () => {
		const css = calloutSettingsToCSS('info', [{ changes: { color: '0, 128, 255' } }], dark);
		expect(css).toContain('[data-callout="info"]');
		expect(css).toContain('--callout-color: 0, 128, 255');
	});

	test('condition-gated setting skipped when condition fails', () => {
		const css = calloutSettingsToCSS(
			'info',
			[{ condition: { colorScheme: 'light' }, changes: { color: '0, 128, 255' } }],
			dark,
		);
		expect(css).toBe('');
	});

	test('condition-gated setting applied when condition passes', () => {
		const css = calloutSettingsToCSS(
			'info',
			[{ condition: { colorScheme: 'dark' }, changes: { icon: 'alert' } }],
			dark,
		);
		expect(css).toContain('--callout-icon: alert');
	});
});
