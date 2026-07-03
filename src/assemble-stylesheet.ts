import type { CalloutID } from '&callout';
import { CalloutResolver } from '&callout-resolver';
import { CalloutSettings, calloutSettingsToCSS, currentCalloutEnvironment } from '&callout-settings';

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
 *
 * Pass 1 seeds the resolver so getCalloutProperties returns values that include user overrides.
 * Pass 2 propagates icon/color from each canonical callout to its aliases.
 * Final order: defaults → alias propagation → user overrides, so an alias with its own
 * explicit setting wins over what it inherited from the canonical.
 */
export function assembleStylesheet(
	settings: Record<CalloutID, CalloutSettings>,
	aliasGroups: Record<string, string[]>,
	env: ReturnType<typeof currentCalloutEnvironment>,
	resolver: CalloutResolver,
): string {
	const userOverrideCSS = Object.entries(settings)
		.map(([id, s]) => calloutSettingsToCSS(id, s, env))
		.filter(Boolean);

	// Pass 1: seed the resolver so getCalloutProperties returns fully-resolved values.
	resolver.setCustomStyles([DEFAULT_CALLOUT_COLORS_CSS, ...userOverrideCSS].join('\n\n'));

	// Pass 2: propagate the canonical's user settings to each alias.
	// We copy the settings directly (preserving var() references) rather than reading
	// resolved values from the shadow-DOM probe, which can produce a slightly different
	// concrete value than the live document resolves at render time.
	// If the canonical has no active user settings, aliases inherit the correct defaults
	// from DEFAULT_CALLOUT_COLORS_CSS and Obsidian's own CSS — no propagation needed.
	const aliasPropagationCSS: string[] = [];
	for (const [canonical, aliases] of Object.entries(aliasGroups)) {
		if (!aliases?.length || !settings[canonical]) continue;
		for (const alias of aliases) {
			const css = calloutSettingsToCSS(alias, settings[canonical], env);
			if (css) aliasPropagationCSS.push(css);
		}
	}

	return [DEFAULT_CALLOUT_COLORS_CSS, ...aliasPropagationCSS, ...userOverrideCSS].join('\n\n');
}
