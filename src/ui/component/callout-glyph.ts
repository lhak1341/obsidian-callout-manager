import { setIcon } from 'obsidian';

import { toCssColor } from '&color';

import { iconIdForRender } from '../../lucide-icons';

const GLYPH_COLOR_VAR = '--calloutmanager-glyph-color';

/**
 * Renders a callout's icon into `el`, tinted with its color.
 *
 * Replaces whatever `el` held before. A missing icon falls back to the default icon (see
 * {@link iconIdForRender}); a missing color leaves the icon in the muted text color. `color` is a
 * stored or resolved callout color: any CSS color, `var(--…)` reference, or legacy `R, G, B` triplet.
 */
export function renderCalloutGlyph(el: HTMLElement, glyph: { icon?: string; color?: string }): void {
	el.addClass('calloutmanager-glyph');
	el.empty();
	setIcon(el, iconIdForRender(glyph.icon));

	if (glyph.color) {
		el.style.setProperty(GLYPH_COLOR_VAR, toCssColor(glyph.color));
	} else {
		el.style.removeProperty(GLYPH_COLOR_VAR);
	}
}

declare const STYLES: `
	.calloutmanager-glyph {
		svg, .svg-icon {
			stroke: var(--calloutmanager-glyph-color, var(--text-muted));
			color: var(--calloutmanager-glyph-color, var(--text-muted));
		}
	}
`;
