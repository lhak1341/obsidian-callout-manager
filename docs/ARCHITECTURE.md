# Architecture

## Callout color model

- `--callout-color` is **not** guaranteed to be an `R, G, B` triplet — per-callout overrides
  in `data.json` can hold a full CSS color (`#4caeaa`). Never wrap it in
  `rgb(var(--callout-color))`; pass it directly to functions taking a `<color>`.
  `toCssColor()` (`src/util/color.ts`, shared by the stylesheet and `renderCalloutGlyph`)
  guards this — do not reintroduce an unconditional `rgb()` wrap when porting upstream
  fixes. It still converts a bare `R, G, B` triplet, but only for old stored `data.json`
  values: the app floor is 1.13.0, so there is no `var()` probe or pre-1.13 triplet support.
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

The id-resolution rules (`resolveIconId()`, `resolveIconIdOrDefault()`, `DEFAULT_ICON_ID`) live in
the obsidian-free `src/icon-id.ts` and are tested there; `src/lucide-icons.ts` only holds the
registry state and exposes `resolveLucideIconId()`/`iconIdForRender()` over it. Which call sites
are deliberately exempt from the empty-id fallback is JSDoc on `iconIdForRender()` — read there
rather than here; the exemption
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
- Edit rules and draft state live in DOM-free sessions (`InsertSession`, `ManageSession`, `RowSession`; no `obsidian` import, tested under both runners). Handlers in the pane, row and modal only render and forward events — don't move validation or draft state back into them.
- Style inputs fan out: settings, alias groups, icon-color adjust, and theme/snippet/color-scheme
  changes can each change any callout's resolved color or icon, since aliases inherit from their
  canonical via propagation CSS. Route every such change through `CalloutRepository`'s
  `invalidateAndNotify()` (user edits) or `environmentChanged()` (Obsidian-side changes) so the
  whole cache drops and consumers get one `change`; do not invalidate by id. `environmentChanged()`
  also pins the order: the style host reloads before the CSS is re-seeded. It notifies only when a
  resolved id/icon/color differs (the public API's `change` event rides on it), and only `css-change`
  triggers it, not `layout-change` (every tab switch; each round re-clones all stylesheets).
- `UIPane` (`src/ui/pane.ts`) hosts one pane at a time — no stack, nav, or suspend/restore
  (removed deliberately; see ADR-0001, Superseded). `ManageCalloutsPane` and `ChangelogPane`
  are the only subclasses.
- Every `Callout` is user-created; there is no built-in/theme/snippet discovery.
  The repository has no source-tracking and `Callout` has no `sources` field — removed
  deliberately (ADR-0003). Reintroducing discovery was proposed and declined once already.
- Reachability check for "is this still used": grep across `api-v1.ts`, `apis.ts`,
  `main.ts`, the other pane files, and `src/**/*.test.ts` — those are the
  only roots, and the test grep catches orphaned test doubles.

Non-obvious call-site-specific traps (why `applyStyles` must stay a closure, why
`createCustomCallout` has no duplicate-id guard unlike `renameCustomCallout`, why
`CalloutManagerAPIs.assertV1` matters even with one version, why `isComplex` gates inline
editing) are commented at their definitions rather than restated here — see `main.ts`,
`callout-repository.ts`, `apis.ts`, and `src/ui/component/callout-row.ts` respectively.

## Editor integrations

Everything that reads or writes note text is split into a pure module (no `obsidian` import, so it
is tested under both runners) and a thin Obsidian adapter. Add rules to the pure side.

- `callout-writer.ts` — inserting a callout: `planInsertion` turns a document, a selection and a
  `CalloutSpec` into one `InsertionEdit`. It owns blank-line separation, quote/list nesting and
  the "never write into properties" rule; `InsertSession.toInsertion` delegates to it.
- `callout-block.ts` — a callout already in a note: `findCalloutAt` (innermost, by quote depth),
  `planUnwrap`, `planFold`, `wrapRange`, `calloutMarkdown`.
- `callout-trigger.ts` — `[!` autocomplete: `readTrigger` (when to open, fenced-code and
  properties aware), `choicesFor`, `planPick` (what a pick writes and where the cursor goes).
- `editor-features.ts` — the only adapter: the wrap/unwrap commands, `CalloutSuggest`
  (`EditorSuggest`) and the `editor-menu` items. It has no unit tests (no DOM here); verify it live.
- `startup-settings.ts`, `settings-validate.ts`, `save-reporter.ts` — loading and saving
  `data.json` safely: entries are validated one at a time, a missing file falls back to
  `data.backup.json`, a file that lost entries is kept in `data.quarantine.json`, and a failed
  save is reported once per streak. Saving stays un-debounced (ADR-0002).

Known limits: a fenced code block is not detected when inserting a callout (autocomplete does
detect it); the right-click menu works in the editor only, not in Reading view.
