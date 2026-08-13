import { addIcon, getIconIds } from 'obsidian';

import lucideIconSvgsJson from './lucide-icon-svgs.json';
import lucideIconTagsJson from './lucide-icon-tags.json';

// Full offline snapshot of Lucide's icon set (lucide-icons/lucide), refreshed
// via `bun run sync:lucide` — bundled at build time so every Lucide icon is
// available with zero network calls, regardless of which (older) subset the
// running Obsidian version bundles natively.
const LUCIDE_ICON_SVGS: Readonly<Record<string, string>> = lucideIconSvgsJson;

// Per-icon search synonyms lucide-static ships (e.g. "flask-conical" ->
// ["lab", "chemistry", "experiment", ...]) — same data lucide.dev's own icon
// search runs on. Applies uniformly regardless of native-vs-gap-filled
// source, since it's keyed by bare icon name either way.
const LUCIDE_ICON_TAGS: Readonly<Record<string, readonly string[]>> = lucideIconTagsJson;

// Obsidian's getIcon()/setIcon() special-case ids starting with "lucide-" to
// resolve only against its native, compiled-in Lucide set. addIcon()-registered
// entries under that same prefix get enumerated by getIconIds() but silently
// fail to resolve at render time (confirmed live in the sister
// obsidian-icon-shortcodes plugin: identical SVG content registered as
// "lucide-<id>" returned null from getIcon() while the same content under a
// separate namespace resolved correctly). Gap-filler icons (real Lucide icons
// not bundled with this Obsidian version) are therefore registered under a
// dedicated prefix instead.
const GAP_ICON_PREFIX = 'callout-manager-lucide-';

// Obsidian's bundled Lucide icon ids carry a "lucide-" prefix.
const NATIVE_ICON_PREFIX = 'lucide-';

// Obsidian wraps addIcon()-registered content in its own
// <svg viewBox="0 0 100 100" class="svg-icon ..."> template. Lucide's raw
// source is authored in a 24x24 viewBox, so passing it through unchanged
// nests a second <svg viewBox="0 0 24 24"> inside that — and CSS
// width/height percentages on a NESTED (non-outermost) <svg> are unreliable
// (this exact bug already happened once in the sister plugin's history). A
// <g transform="scale(...)"> avoids that nested-svg percentage ambiguity
// entirely — transforms apply predictably regardless of nesting — and
// uniformly scaling also scales stroke-width, preserving the icon's
// proportions rather than just its outline size.
function scaleToCustomIconViewport(svgText: string): string {
	const source = new DOMParser().parseFromString(svgText, 'image/svg+xml').documentElement;
	const [, , viewBoxWidth] = (source.getAttribute('viewBox') ?? '0 0 24 24').split(/\s+/).map(Number);
	const scale = 100 / (viewBoxWidth || 24);

	const group = createSvg('g');
	group.setAttribute('transform', `scale(${scale})`);
	for (const attr of ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin']) {
		const value = source.getAttribute(attr);
		if (value) group.setAttribute(attr, value);
	}
	while (source.firstChild) group.appendChild(source.firstChild);

	return group.outerHTML;
}

let nativeNames = new Set<string>();
let gapNames = new Set<string>();

/**
 * Registers every bundled Lucide icon not already natively available in this
 * Obsidian version under {@link GAP_ICON_PREFIX}. Call once during `onload()`,
 * before anything renders an icon.
 */
export function registerLucideIcons(): void {
	// Computed first so an icon that this Obsidian version happens to bundle
	// natively already defers to the native one below, instead of the
	// (possibly older) snapshot in the bundle shadowing it.
	nativeNames = new Set(
		getIconIds()
			.filter((id) => id.startsWith(NATIVE_ICON_PREFIX))
			.map((id) => id.slice(NATIVE_ICON_PREFIX.length)),
	);

	const newGapNames = new Set<string>();
	for (const [name, svg] of Object.entries(LUCIDE_ICON_SVGS)) {
		if (nativeNames.has(name)) continue;
		addIcon(GAP_ICON_PREFIX + name, scaleToCustomIconViewport(svg));
		newGapNames.add(name);
	}
	gapNames = newGapNames;
}

/**
 * All known Lucide icon names (native + gap-filled), bare (no "lucide-"
 * prefix) — for suggestion candidate lists.
 */
export function allLucideIconNames(): string[] {
	return Array.from(new Set([...nativeNames, ...gapNames]));
}

/** Search synonyms for a bare icon name (e.g. "flask-conical" -> ["lab", "chemistry", ...]), or [] if untagged. */
export function getLucideIconTags(name: string): readonly string[] {
	return LUCIDE_ICON_TAGS[name] ?? [];
}

/**
 * Resolves a stored icon id (bare, e.g. "flame", or "lucide-"-prefixed, e.g.
 * "lucide-flame" — this repo's storage carries both forms) to an id that
 * `getIcon()`/`setIcon()` will actually resolve: the native "lucide-" id if
 * Obsidian bundles it, the gap-filled custom id if not, or the original id
 * unchanged if it's not a known Lucide icon at all (defensive — an
 * unresolvable/typo'd id behaves exactly as it does today, no regression).
 */
export function resolveLucideIconId(storedId: string): string {
	const bareName = storedId.startsWith(NATIVE_ICON_PREFIX) ? storedId.slice(NATIVE_ICON_PREFIX.length) : storedId;

	if (nativeNames.has(bareName)) return NATIVE_ICON_PREFIX + bareName;
	if (gapNames.has(bareName)) return GAP_ICON_PREFIX + bareName;
	return storedId;
}

/** Placeholder icon shown wherever a callout has no icon set yet (e.g. a still-unconfigured row). */
export const DEFAULT_ICON_ID = 'lucide-pencil';

/**
 * `resolveLucideIconId`, but falls back to {@link DEFAULT_ICON_ID} first if `id` is empty/undefined.
 * For call sites that render an icon straight to the DOM via `setIcon()`/`getIcon()`. Don't use this
 * to pre-resolve an id headed into `CalloutPreviewComponent` — it already resolves internally, and
 * some callers (e.g. `CalloutResolver`'s hidden probe) rely on being able to pass an empty icon
 * through unresolved. Use the bare {@link DEFAULT_ICON_ID} constant for those instead.
 */
export function iconIdForRender(id: string | undefined): string {
	return resolveLucideIconId(id || DEFAULT_ICON_ID);
}
