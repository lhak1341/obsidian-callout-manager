/**
 * Parses the version number from a changelog H1 heading, e.g. "Version 1.2.3".
 * Returns undefined if the heading doesn't match the expected format.
 */
export function parseChangelogVersion(headingText: string): string | undefined {
	return /^\s*Version ([0-9.]+)\s*$/.exec(headingText)?.[1];
}
