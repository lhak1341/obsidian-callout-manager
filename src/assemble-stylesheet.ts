import type { CalloutID } from '&callout';
import { CalloutEnvironment, CalloutSettings, calloutSettingsToCSS } from '&callout-settings';

const DEFAULT_CALLOUT_COLORS_CSS = `
.callout[data-callout='note'],
.callout[data-callout='location'],
.callout[data-callout='info'],
.callout[data-callout='todo'] { --callout-color: var(--color-blue) }

.callout[data-callout='abstract'],
.callout[data-callout='summary'],
.callout[data-callout='tldr'],
.callout[data-callout='tip'],
.callout[data-callout='hint'] { --callout-color: var(--color-cyan) }

.callout[data-callout='pros'],
.callout[data-callout='positive'],
.callout[data-callout='practice'],
.callout[data-callout='success'],
.callout[data-callout='check'],
.callout[data-callout='done'] { --callout-color: var(--color-green) }

.callout[data-callout='recipe'],
.callout[data-callout='cue'],
.callout[data-callout='question'],
.callout[data-callout='faq'],
.callout[data-callout='help'],
.callout[data-callout='idea'],
.callout[data-callout='win'],
.callout[data-callout='reward'] { --callout-color: var(--color-yellow) }

.callout[data-callout='warning'],
.callout[data-callout='caution'],
.callout[data-callout='attention'],
.callout[data-callout='reminder'] { --callout-color: var(--color-orange) }

.callout[data-callout='favorite'],
.callout[data-callout='bookmark'],
.callout[data-callout='important'] { --callout-color: var(--color-pink) }

.callout[data-callout='cons'],
.callout[data-callout='negative'],
.callout[data-callout='failure'],
.callout[data-callout='fail'],
.callout[data-callout='missing'],
.callout[data-callout='danger'],
.callout[data-callout='error'],
.callout[data-callout='debug'],
.callout[data-callout='bug'] { --callout-color: var(--color-red) }

.callout[data-callout='event'],
.callout[data-callout='reference'],
.callout[data-callout='example'] { --callout-color: var(--color-purple) }

.callout[data-callout='cite'],
.callout[data-callout='file'],
.callout[data-callout='attachment'],
.callout[data-callout='url'],
.callout[data-callout='link'],
.callout[data-callout='navi'],
.callout[data-callout='palette'] { --callout-color: var(--callout-quote) }
`.trim();

/**
 * Assembles the full stylesheet for user-configured callout overrides and alias propagation.
 * Final order: defaults → alias propagation → user overrides, so an alias with its own
 * explicit setting wins over what it inherited from the canonical.
 */
export function assembleStylesheet(
	settings: Record<CalloutID, CalloutSettings>,
	aliasGroups: Record<string, string[]>,
	env: CalloutEnvironment,
	iconColorAdjust?: Record<'light' | 'dark', { saturation: number; lightness: number }>,
): string {
	const userOverrideCSS = Object.entries(settings)
		.map(([id, s]) => calloutSettingsToCSS(id, s, env))
		.filter(Boolean);

	// Propagate the canonical's user settings to each alias by copying settings directly
	// (preserving var() references). Reading resolved values from the shadow-DOM probe
	// can produce slightly different concrete values than the live document resolves at
	// render time. If the canonical has no active user settings, aliases inherit from
	// DEFAULT_CALLOUT_COLORS_CSS and Obsidian's own CSS — no propagation needed.
	const aliasPropagationCSS: string[] = [];
	for (const [canonical, aliases] of Object.entries(aliasGroups)) {
		if (!aliases?.length || !settings[canonical]) continue;
		for (const alias of aliases) {
			const css = calloutSettingsToCSS(alias, settings[canonical], env);
			if (css) aliasPropagationCSS.push(css);
		}
	}

	const iconColorAdjustCSS = assembleIconColorAdjustCSS(iconColorAdjust?.[env.colorScheme]);

	return [DEFAULT_CALLOUT_COLORS_CSS, ...aliasPropagationCSS, ...userOverrideCSS, iconColorAdjustCSS]
		.filter(Boolean)
		.join('\n\n');
}

/**
 * Builds a global override that shifts every callout header's (icon + title text) saturation/
 * lightness by a fixed offset, relative to its own resolved `--callout-color`. Obsidian's own
 * CSS sets the icon's color via `.callout-icon .svg-icon { color: var(--callout-color) }`
 * (two-class specificity) — a bare `.callout-icon` rule loses to it regardless of stylesheet
 * order, so the override must match that selector exactly. The callout body/border are
 * untouched.
 *
 * `--callout-color` isn't guaranteed to be an `R, G, B` triplet (per-callout overrides in
 * data.json can be hex/named colors), so it's passed to `hsl(from ...)` as-is rather than
 * wrapped in `rgb()`. The `s`/`l` calc offsets must stay unitless numbers, not `%` — this
 * Chromium's relative-color implementation produces a wrong color when a `%` unit is added
 * inside the calc() (confirmed via live obsidian eval), even though `%` is spec-legal here.
 *
 * Emits nothing when both offsets are zero, so default output is unchanged.
 */
function assembleIconColorAdjustCSS(adjust: { saturation: number; lightness: number } | undefined): string {
	if (!adjust || (adjust.saturation === 0 && adjust.lightness === 0)) {
		return '';
	}

	return (
		`.callout-title, .callout-icon .svg-icon {\n` +
		`\tcolor: hsl(from var(--callout-color) h calc(s + ${adjust.saturation}) calc(l + ${adjust.lightness}));\n` +
		`}`
	);
}
