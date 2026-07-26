import { describe, expect, test } from '@jest/globals';

import { determineAppearanceType, unifiedAppearanceToSettings } from './callout-appearance';
import { CalloutSettings } from '&callout-settings';

describe('determineAppearanceType', () => {
	test('empty settings → unified, no color/icon', () => {
		expect(determineAppearanceType([])).toStrictEqual({
			type: 'unified',
			color: undefined,
			otherChanges: { icon: undefined },
		});
	});

	test('single unconditional change → unified', () => {
		const settings: CalloutSettings = [{ changes: { color: 'red', icon: 'lucide-flame' } }];
		expect(determineAppearanceType(settings)).toStrictEqual({
			type: 'unified',
			color: 'red',
			otherChanges: { icon: 'lucide-flame' },
		});
	});

	test('color only → unified, icon undefined', () => {
		const settings: CalloutSettings = [{ changes: { color: 'red' } }];
		expect(determineAppearanceType(settings)).toStrictEqual({
			type: 'unified',
			color: 'red',
			otherChanges: { icon: undefined },
		});
	});

	test('any conditional setting → complex', () => {
		const settings: CalloutSettings = [{ condition: { and: [] }, changes: { color: 'red' } }];
		expect(determineAppearanceType(settings)).toStrictEqual({ type: 'complex', settings });
	});

	test('duplicate change to the same property → complex', () => {
		const settings: CalloutSettings = [{ changes: { color: 'red' } }, { changes: { color: 'blue' } }];
		expect(determineAppearanceType(settings)).toStrictEqual({ type: 'complex', settings });
	});

	test('customStyles → complex, even with no condition and no duplicates', () => {
		// This UI has no widget for customStyles — classifying it as unified would let
		// editing color/icon silently discard it (unifiedAppearanceToSettings only knows
		// about color/icon). Must never happen.
		const settings: CalloutSettings = [{ changes: { color: 'red', customStyles: '.foo { color: red; }' } }];
		expect(determineAppearanceType(settings)).toStrictEqual({ type: 'complex', settings });
	});
});

describe('unifiedAppearanceToSettings', () => {
	test('both empty → []', () => {
		expect(unifiedAppearanceToSettings(undefined, undefined)).toStrictEqual([]);
		expect(unifiedAppearanceToSettings('', '')).toStrictEqual([]);
	});

	test('color only', () => {
		expect(unifiedAppearanceToSettings('red', undefined)).toStrictEqual([{ changes: { color: 'red' } }]);
	});

	test('icon only', () => {
		expect(unifiedAppearanceToSettings(undefined, 'lucide-flame')).toStrictEqual([
			{ changes: { icon: 'lucide-flame' } },
		]);
	});

	test('color and icon', () => {
		expect(unifiedAppearanceToSettings('red', 'lucide-flame')).toStrictEqual([
			{ changes: { color: 'red', icon: 'lucide-flame' } },
		]);
	});

	test('round-trips through determineAppearanceType', () => {
		const settings = unifiedAppearanceToSettings('red', 'lucide-flame');
		expect(determineAppearanceType(settings)).toStrictEqual({
			type: 'unified',
			color: 'red',
			otherChanges: { icon: 'lucide-flame' },
		});
	});
});
