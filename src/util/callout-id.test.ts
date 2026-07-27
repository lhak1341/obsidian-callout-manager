import { describe, expect, test } from '@jest/globals';

import { isValidCalloutId, slugifyCalloutId } from './callout-id';

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
