import { describe, expect, test } from '@jest/globals';

import { isValidCalloutId, normalizeCalloutId, slugifyCalloutId } from './callout-id';

describe('isValidCalloutId', () => {
	test('accepts lowercase letters, digits, and hyphens starting with a letter', () => {
		expect(isValidCalloutId('note')).toBe(true);
		expect(isValidCalloutId('my-callout-2')).toBe(true);
	});

	test('rejects an empty string', () => {
		expect(isValidCalloutId('')).toBe(false);
	});

	test('rejects an id starting with a digit or hyphen', () => {
		expect(isValidCalloutId('2fast')).toBe(false);
		expect(isValidCalloutId('-note')).toBe(false);
	});

	test('rejects uppercase letters, spaces, and other punctuation', () => {
		expect(isValidCalloutId('Note')).toBe(false);
		expect(isValidCalloutId('my callout')).toBe(false);
		expect(isValidCalloutId('note!')).toBe(false);
	});
});

describe('slugifyCalloutId', () => {
	test('trims surrounding whitespace', () => {
		expect(slugifyCalloutId('  note  ')).toBe('note');
	});

	test('lowercases the input', () => {
		expect(slugifyCalloutId('My Callout')).toBe('my-callout');
	});

	test('collapses runs of whitespace into a single hyphen', () => {
		expect(slugifyCalloutId('my    new   callout')).toBe('my-new-callout');
	});

	test('leaves an already-valid id unchanged', () => {
		expect(slugifyCalloutId('my-callout-2')).toBe('my-callout-2');
	});

	test('does not strip punctuation other than whitespace', () => {
		expect(slugifyCalloutId('note!')).toBe('note!');
	});
});

describe('normalizeCalloutId', () => {
	test('slugifies a valid name', () => {
		expect(normalizeCalloutId('  My Callout ')).toEqual({ ok: true, id: 'my-callout' });
	});

	test('reports blank input as empty with no message', () => {
		expect(normalizeCalloutId('   ')).toEqual({ ok: false, reason: 'empty', message: '' });
	});

	test('reports an invalid shape with the assert message', () => {
		const result = normalizeCalloutId('2fast');
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe('invalid');
			expect(result.message).toContain("Invalid callout id: '2fast'");
		}
	});
});
