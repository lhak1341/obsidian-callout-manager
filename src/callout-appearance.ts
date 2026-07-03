import { CalloutSettings, CalloutSettingsChanges } from '&callout-settings';

/**
 * A complex appearance.
 *
 * This cannot be represented with a UI, and must be changed manually in the
 * plugin's `data.json` settings.
 */
export type ComplexAppearance = {
	type: 'complex';
	settings: CalloutSettings;
};

/**
 * Unified appearance.
 *
 * A single color and icon, applied unconditionally.
 */
export type UnifiedAppearance = {
	type: 'unified';
	color: string | undefined;
	otherChanges: Exclude<CalloutSettingsChanges, { color: string }>;
};

export type Appearance = UnifiedAppearance | ComplexAppearance;

/**
 * Determines the {@link Appearance} for the provided callout settings.
 * @param settings The settings to determine the appearance type for.
 */
export function determineAppearanceType(settings: CalloutSettings): Appearance {
	return determineUnifiedAppearance(settings) ?? { type: 'complex', settings };
}

function determineUnifiedAppearance(settings: CalloutSettings): UnifiedAppearance | null {
	const changes: CalloutSettingsChanges = {};

	for (const setting of settings) {
		// Any conditional setting → complex
		if (setting.condition !== undefined) {
			return null;
		}

		for (const [key, value] of Object.entries(setting.changes)) {
			if (value === undefined) continue;
			if (key in changes) {
				// Duplicate change to the same property → complex
				return null;
			}
			(changes as Record<string, unknown>)[key] = value;
		}
	}

	const { color, ...otherChanges } = changes;
	return { type: 'unified', color, otherChanges };
}
