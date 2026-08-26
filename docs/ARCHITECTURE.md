# Architecture

## Callout color model

- `--callout-color` is **not** guaranteed to be an `R, G, B` triplet — per-callout overrides
  in `data.json` can hold a full CSS color (`#4caeaa`). Never wrap it in
  `rgb(var(--callout-color))`; pass it directly to functions taking a `<color>`.
  `calloutSettingsToStyles`'s `toCssColor()` guards this — do not reintroduce an
  unconditional `rgb()` wrap when porting upstream fixes.
- `--callout-color` cascades passively (works even in Settings renderers), but
  `--callout-icon` requires an active `setIcon()` call timed to DOM insertion. Correct color
  with a missing icon means the injection fired before or without DOM attachment.
- When debugging color/alias bugs, read the vault's `data.json` first — many "built-in"
  callouts carry explicit color/icon settings there that affect alias propagation.

## Icon registry

`src/lucide-icons.ts` bundles the full Lucide icon set offline so icons missing from
Obsidian's version-pinned native set still render. `registerLucideIcons()` registers
non-native icons under the `callout-manager-lucide-` prefix, not `lucide-` — Obsidian's
`getIcon()`/`setIcon()` silently fail to resolve `addIcon()`-registered entries under the
native `lucide-` prefix. Icon ids are stored both bare (`"flame"`) and `lucide-`-prefixed
(`"lucide-flame"`).

The id-resolution rules (`DEFAULT_ICON_ID`, `resolveLucideIconId()`, `iconIdForRender()`,
and which call sites are deliberately exempt from the fallback) are documented as JSDoc on
those symbols in `src/lucide-icons.ts` — read there rather than here; the exemption
rationale is also commented at each exempt call site (`icon-reinjection.ts`,
`icon-suggest.ts`).

`src/icon-search.ts` (used by `IconSuggest.getSuggestions()` for name+tag ranked search) has
no `obsidian` import deliberately — it's tested under both Jest and `bun test`, and
importing `obsidian` there breaks at least one of the two runners.

## Structure

- Panes take `CalloutStore` (`src/callout-store.ts`), not `CalloutManagerPlugin` — the
  interface is the seam. `CalloutStore` is the full write surface (`CalloutReader` +
  `AliasStore` + `IconColorAdjustStore` + CRUD) and only `ManageCalloutsPane` needs all of
  it. Read-only consumers (`InsertCalloutModal`, `apis.ts`, `api-v1.ts`) should depend on the
  narrow interfaces directly.
- `UIPane` (`src/ui/pane.ts`) hosts one pane at a time — no stack, nav, or suspend/restore
  (removed deliberately; see ADR-0001, Superseded). `ManageCalloutsPane` and `ChangelogPane`
  are the only subclasses.
- Every `Callout` is user-created; there is no built-in/theme/snippet discovery.
  `CalloutCollection` has no source-tracking and `Callout` has no `sources` field — removed
  deliberately (ADR-0003). Reintroducing discovery was proposed and declined once already.
- Reachability check for "is this still used": grep across `api-v1.ts`, `apis.ts`,
  `api-common.ts`, `main.ts`, the other pane files, and `src/**/*.test.ts` — those are the
  only roots, and the test grep catches orphaned test doubles.

Non-obvious call-site-specific traps (why `applyStyles` must stay a closure, why
`createCustomCallout` has no duplicate-id guard unlike `renameCustomCallout`, why
`CalloutManagerAPIs.assertV1` matters even with one version, why `isComplex` gates inline
editing) are commented at their definitions rather than restated here — see `main.ts`,
`callout-repository.ts`, `apis.ts`, and `src/ui/component/callout-row.ts` respectively.
