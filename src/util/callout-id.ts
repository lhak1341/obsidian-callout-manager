const CALLOUT_ID_PATTERN = /^[a-z][a-z0-9-]*$/;

export function isValidCalloutId(id: string): boolean {
	return CALLOUT_ID_PATTERN.test(id);
}

/**
 * Normalizes free-form user input (e.g. a name typed into a text field) into a
 * callout-id-shaped string: trimmed, lowercased, whitespace runs collapsed to `-`.
 * Does not guarantee the result is valid — check with {@link isValidCalloutId}.
 */
export function slugifyCalloutId(input: string): string {
	return input.trim().toLowerCase().replace(/\s+/g, '-');
}
