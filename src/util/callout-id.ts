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

export type NormalizedCalloutId =
	| { ok: true; id: string }
	| { ok: false; reason: 'empty' | 'invalid'; message: string };

/**
 * Slugifies free-form input and checks the result. `empty` is distinct from `invalid` because
 * an empty field is a no-op for the UI, not an error worth a message.
 */
export function normalizeCalloutId(input: string): NormalizedCalloutId {
	const id = slugifyCalloutId(input);
	if (!id) return { ok: false, reason: 'empty', message: '' };
	try {
		assertValidCalloutId(id);
	} catch (error) {
		return { ok: false, reason: 'invalid', message: error instanceof Error ? error.message : String(error) };
	}
	return { ok: true, id };
}
