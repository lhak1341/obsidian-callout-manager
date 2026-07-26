import { describe, expect, test } from '@jest/globals';

import { parseChangelogVersion } from './changelog-version';

describe('parseChangelogVersion', () => {
	test('matches "Version X.Y.Z"', () => {
		expect(parseChangelogVersion('Version 1.2.3')).toBe('1.2.3');
	});

	test('tolerates surrounding whitespace', () => {
		expect(parseChangelogVersion('  Version 1.2.3  ')).toBe('1.2.3');
	});

	test('matches partial version numbers', () => {
		expect(parseChangelogVersion('Version 1.2')).toBe('1.2');
		expect(parseChangelogVersion('Version 1')).toBe('1');
	});

	test('drifted heading format falls back to undefined', () => {
		// This is the actual risk: if a future CHANGELOG.md heading stops matching this
		// shape, getSections silently falls back to raw heading text as the map key, and
		// the "highlight current version" feature quietly stops working with no signal.
		expect(parseChangelogVersion('v1.2.3')).toBeUndefined();
		expect(parseChangelogVersion('Version1.2.3')).toBeUndefined();
		expect(parseChangelogVersion('Release 1.2.3')).toBeUndefined();
		expect(parseChangelogVersion('')).toBeUndefined();
	});
});
