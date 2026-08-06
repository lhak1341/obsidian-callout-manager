import { App } from 'obsidian';
import { getCurrentColorScheme, getCurrentThemeID } from 'obsidian-extra';
import type { ThemeID } from 'obsidian-undocumented';

import { CalloutID } from '&callout';

/**
 * Gets the current environment that callouts are under.
 * This can be passed to {@link calloutSettingsToCSS}.
 *
 * @param app The app instance.
 * @returns The callout environment.
 */
export function currentCalloutEnvironment(app: App): CalloutEnvironment {
	const theme = getCurrentThemeID(app) ?? '<default>';
	return {
		theme,
		colorScheme: getCurrentColorScheme(app),
	};
}

const COLOR_TRIPLET = /^\s*[\d.]+%?\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*$/;

/**
 * Normalizes a stored `color` value into a valid CSS `<color>`.
 *
 * Most values (hex, `var(...)`) are already valid CSS colors and must be passed through as-is —
 * wrapping them in `rgb(...)` produces invalid nested syntax (e.g. `rgb(#3079b0)`), which silently
 * drops the callout's background/border color. Only a bare `R, G, B` triplet (the legacy upstream
 * convention) needs the `rgb(...)` wrapper to become valid on its own.
 */
function toCssColor(color: string): string {
	return COLOR_TRIPLET.test(color) ? `rgb(${color})` : color;
}

/**
 * Converts callout settings to CSS that applies the setting.
 *
 * @param id The callout ID.
 * @param settings The settings for the callout.
 * @param environment The environment to resolve conditions under.
 */
export function calloutSettingsToCSS(
	id: CalloutID,
	settings: CalloutSettings,
	environment: CalloutEnvironment,
): string {
	const styles = calloutSettingsToStyles(settings, environment).join(';\n\t');
	if (styles.length === 0) {
		return '';
	}

	return `.callout[data-callout="${id}"] {\n\t` + styles + '\n}';
}

/**
 * Converts callout settings to a list of styles that apply the setting.
 *
 * @param condition The active conditions.
 */
export function calloutSettingsToStyles(
	settings: CalloutSettings,
	environment: CalloutEnvironment,
): string[] {
	const styles: string[] = [];

	for (const setting of settings) {
		if (!checkCondition(setting.condition, environment)) {
			continue;
		}

		// Build the styles.
		const { changes } = setting;
		if (changes.color != null) styles.push(`--callout-color: ${toCssColor(changes.color)}`);
		if (changes.icon != null) styles.push(`--callout-icon: ${changes.icon}`);
		if (changes.customStyles != null) styles.push(changes.customStyles);
	}

	return styles;
}

/**
 * Recursively checks a {@link CalloutSettingsCondition}.
 *
 * @param condition The condition to check.
 * @param environment The environment to check the condition against.
 *
 * @returns True if the condition holds for the given environment.
 */
export function checkCondition(
	condition: CalloutSettingsCondition,
	environment: CalloutEnvironment,
): boolean {
	if (condition == null) {
		return true;
	}

	// "or" combinator.
	if ('or' in condition && condition.or !== undefined) {
		return condition.or.findIndex((p) => checkCondition(p, environment) === true) !== -1;
	}

	// "and" combinator.
	if ('and' in condition && condition.and !== undefined) {
		return condition.and.findIndex((p) => checkCondition(p, environment) === false) === -1;
	}

	// Theme condition.
	if ('theme' in condition && condition.theme === environment.theme) {
		return true;
	}

	// Dark mode condition.
	if ('colorScheme' in condition && condition.colorScheme === environment.colorScheme) {
		return true;
	}

	return false;
}

// ---------------------------------------------------------------------------------------------------------------------
// DSL:
// ---------------------------------------------------------------------------------------------------------------------

/**
 * The theme/color-scheme context passed to condition checks.
 */
export type CalloutEnvironment = { theme: string; colorScheme: 'dark' | 'light' };

/** A condition that checks the current Obsidian theme. */
export type CalloutSettingsThemeCondition = { theme: ThemeID | '<default>' };

/** A condition that checks the current color scheme of Obsidian */
export type CalloutSettingsColorSchemeCondition = { colorScheme: 'dark' | 'light' };

/** Conditions that can either be true or false by themselves. */
export type CalloutSettingsElementaryConditions = CalloutSettingsThemeCondition | CalloutSettingsColorSchemeCondition;

/** Conditions that combine other conditions based on binary logic operations. */
export type CalloutSettingsCombinatoryConditions =
	| { and: CalloutSettingsCondition[] }
	| { or: CalloutSettingsCondition[] };

/**
 * Changes that can be applied to a callout.
 */
export type CalloutSettingsChanges = {
	/**
	 * Changes the callout color.
	 */
	color?: string;

	/**
	 * Changes the callout icon.
	 */
	icon?: string;

	/**
	 * Applies custom styles to the callout.
	 */
	customStyles?: string;
};

/**
 * Conditions that affect when callout changes are applied.
 */
export type CalloutSettingsCondition =
	| undefined
	| CalloutSettingsElementaryConditions
	| CalloutSettingsCombinatoryConditions;

/**
 * A setting that changes a callout's appearance when the given condition holds true.
 * If no condition is provided (or it is undefined), the changes will always be applied.
 */
export type CalloutSetting<C extends CalloutSettingsCondition = CalloutSettingsCondition> = {
	condition?: C;
	changes: CalloutSettingsChanges;
};

/**
 * An array of {@link CalloutSetting} objects.
 */
export type CalloutSettings<C extends CalloutSettingsCondition = CalloutSettingsCondition> = Array<CalloutSetting<C>>;
