// No `obsidian` import, deliberately: these rules are tested under both Jest and `bun test`,
// and `lucide-icons.ts` (which holds the registry state) cannot load under either.

// Obsidian's getIcon()/setIcon() special-case ids starting with "lucide-" to
// resolve only against its native, compiled-in Lucide set. addIcon()-registered
// entries under that same prefix get enumerated by getIconIds() but silently
// fail to resolve at render time (confirmed live in the sister
// obsidian-icon-shortcodes plugin: identical SVG content registered as
// "lucide-<id>" returned null from getIcon() while the same content under a
// separate namespace resolved correctly). Gap-filler icons (real Lucide icons
// not bundled with this Obsidian version) are therefore registered under a
// dedicated prefix instead.
export const GAP_ICON_PREFIX = 'callout-manager-lucide-';

// Obsidian's bundled Lucide icon ids carry a "lucide-" prefix.
export const NATIVE_ICON_PREFIX = 'lucide-';

/** Placeholder icon shown wherever a callout has no icon set yet (e.g. a still-unconfigured row). */
export const DEFAULT_ICON_ID = 'lucide-pencil';

/** Bare (unprefixed) names of the Lucide icons available in this Obsidian version. */
export interface IconRegistry {
	/** Icons Obsidian bundles natively, under {@link NATIVE_ICON_PREFIX}. */
	native: ReadonlySet<string>;
	/** Icons this plugin registered itself, under {@link GAP_ICON_PREFIX}. */
	gap: ReadonlySet<string>;
}

/**
 * Resolves a stored icon id (bare, e.g. "flame", or "lucide-"-prefixed, e.g.
 * "lucide-flame" — this repo's storage carries both forms) to an id that
 * `getIcon()`/`setIcon()` will actually resolve: the native "lucide-" id if
 * Obsidian bundles it, the gap-filled custom id if not, or the original id
 * unchanged if it's not a known Lucide icon at all (defensive — an
 * unresolvable/typo'd id behaves exactly as it does today, no regression).
 */
export function resolveIconId(storedId: string, registry: IconRegistry): string {
	const bareName = storedId.startsWith(NATIVE_ICON_PREFIX) ? storedId.slice(NATIVE_ICON_PREFIX.length) : storedId;

	if (registry.native.has(bareName)) return NATIVE_ICON_PREFIX + bareName;
	if (registry.gap.has(bareName)) return GAP_ICON_PREFIX + bareName;
	return storedId;
}

/** {@link resolveIconId}, but an empty/undefined id becomes {@link DEFAULT_ICON_ID} first. */
export function resolveIconIdOrDefault(id: string | undefined, registry: IconRegistry): string {
	return resolveIconId(id || DEFAULT_ICON_ID, registry);
}
