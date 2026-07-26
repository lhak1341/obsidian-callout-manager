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
 * A single color and icon, applied unconditionally. `customStyles` (or any future
 * change the UI has no widget for) is not representable here — settings with such
 * a change classify as {@link ComplexAppearance} instead, so this UI never silently
 * discards a change it doesn't know how to edit.
 */
export type UnifiedAppearance = {
	type: 'unified';
	color: string | undefined;
	otherChanges: { icon?: string };
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
			if (key !== 'color' && key !== 'icon') {
				// A change this UI has no widget for (e.g. customStyles) → complex,
				// so editing color/icon can never silently drop it.
				return null;
			}
			(changes as Record<string, unknown>)[key] = value;
		}
	}

	const { color, icon } = changes;
	return { type: 'unified', color, otherChanges: { icon } };
}

/**
 * Builds the {@link CalloutSettings} for a {@link UnifiedAppearance}'s color/icon —
 * the inverse of {@link determineUnifiedAppearance}. An empty string for either
 * value means "no override"; if both are empty, the result is `[]`.
 */
export function unifiedAppearanceToSettings(color: string | undefined, icon: string | undefined): CalloutSettings {
	const changes: CalloutSettingsChanges = {};
	if (color) changes.color = color;
	if (icon) changes.icon = icon;
	return Object.keys(changes).length ? [{ changes }] : [];
}
