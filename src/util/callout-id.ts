const CALLOUT_ID_PATTERN = /^[a-z][a-z0-9-]*$/;

export function isValidCalloutId(id: string): boolean {
	return CALLOUT_ID_PATTERN.test(id);
}

/** Throws if `id` doesn't match the callout-id shape. */
export function assertValidCalloutId(id: string): void {
	if (!isValidCalloutId(id)) {
		throw new Error(
			`Invalid callout id: '${id}'. Ids must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens.`,
		);
	}
}

/**
 * Normalizes free-form user input (e.g. a name typed into a text field) into a
 * callout-id-shaped string: trimmed, lowercased, whitespace runs collapsed to `-`.
 * Does not guarantee the result is valid — check with {@link isValidCalloutId}.
 */
export function slugifyCalloutId(input: string): string {
	return input.trim().toLowerCase().replace(/\s+/g, '-');
}
