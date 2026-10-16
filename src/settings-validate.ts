import type { CalloutSetting, CalloutSettings, CalloutSettingsCondition } from './callout-settings';

export function isPlainObject(value: unknown): value is Record<string, unknown> {
	return value != null && typeof value === 'object' && !Array.isArray(value);
}

// The stylesheet interpolates ids into `.callout[data-callout="<id>"]` and icon/color values into
// declarations, so a value from `data.json` (sync conflict, hand edit, import) must not be able to
// close the string, the declaration, or the rule. Anything else is accepted: older and upstream
// data holds ids that `isValidCalloutId` would reject, and dropping those loses the user's work.
const UNSAFE_ID = /["\\\r\n{};<>]/;
const ICON_ID = /^[\w.:-]+$/;
const UNSAFE_COLOR = /[;{}<>]|\/\*/;

/** Whether `id` can be written into a `[data-callout="…"]` selector without escaping. */
export function isSafeStoredCalloutId(id: unknown): id is string {
	return typeof id === 'string' && id.length > 0 && !UNSAFE_ID.test(id);
}

function isValidIcon(icon: unknown): icon is string {
	return typeof icon === 'string' && ICON_ID.test(icon);
}

function isValidColor(color: unknown): color is string {
	return typeof color === 'string' && color.trim().length > 0 && !UNSAFE_COLOR.test(color);
}

function isValidCondition(condition: unknown): condition is CalloutSettingsCondition {
	if (condition === undefined) return true;
	if (!isPlainObject(condition)) return false;
	if ('and' in condition) return Array.isArray(condition.and) && condition.and.every(isValidCondition);
	if ('or' in condition) return Array.isArray(condition.or) && condition.or.every(isValidCondition);
	if ('theme' in condition) return typeof condition.theme === 'string';
	if ('colorScheme' in condition) return condition.colorScheme === 'dark' || condition.colorScheme === 'light';
	return false;
}

/**
 * Keeps the valid fields of one stored setting. An invalid `color`/`icon` is removed from its
 * `changes` (the rest of the setting survives); an invalid condition or a missing `changes` object
 * drops the whole setting, since without its condition it would apply when it should not.
 * Unknown fields are carried through untouched.
 */
function sanitizeSetting(item: unknown, where: string, dropped: string[]): CalloutSetting | null {
	if (!isPlainObject(item) || !isPlainObject(item.changes) || !isValidCondition(item.condition)) {
		dropped.push(where);
		return null;
	}

	const changes: Record<string, unknown> = { ...item.changes };
	if ('color' in changes && !isValidColor(changes.color)) {
		delete changes.color;
		dropped.push(`${where}.color`);
	}
	if ('icon' in changes && !isValidIcon(changes.icon)) {
		delete changes.icon;
		dropped.push(`${where}.icon`);
	}
	if ('customStyles' in changes && typeof changes.customStyles !== 'string') {
		delete changes.customStyles;
		dropped.push(`${where}.customStyles`);
	}

	// Validated above; the cast only re-attaches the field types the checks established.
	return { ...item, changes } as CalloutSetting;
}

/** Validates one callout's stored settings array entry by entry. */
export function sanitizeCalloutSettings(id: string, entries: unknown[], dropped: string[]): CalloutSettings {
	const kept: CalloutSettings = [];
	entries.forEach((item, index) => {
		const setting = sanitizeSetting(item, `callouts.settings.${id}[${index}]`, dropped);
		if (setting) kept.push(setting);
	});
	return kept;
}
