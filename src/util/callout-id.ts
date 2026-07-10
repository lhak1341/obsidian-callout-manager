const CALLOUT_ID_PATTERN = /^[a-z][a-z0-9-]*$/;

export function isValidCalloutId(id: string): boolean {
	return CALLOUT_ID_PATTERN.test(id);
}
