# Callout Manager (lhak fork)

Fork of `eth-p/obsidian-callout-manager`. Not published to npm or the community store —
install/dev docs should describe manual copy or BRAT, not upstream's install flow.

House conventions for Obsidian plugin repos live in the `obsidian-plugin-dev` skill —
including upstream-sync procedure, settings-tab structure, CSS specificity, and live
debugging. Only repo-specific facts are below.

Has `graphify-out/`.

## Upstream

No remote configured by default; add temporarily with `git remote add upstream <url>`.

Reviewed through `bfdf696` (tag `1.1.2`, 2026-08-07). Cherry-picked its 3 real fixes by
hand: Obsidian 1.13's `--callout-color` needing a full `rgb(...)`/CSS color rather than a
bare triplet (`callout-util.ts`, `callout-settings.ts`, `callout-preview.ts`,
`changelog.ts`), and deprecated `MarkdownRenderer.renderMarkdown` → `.render(app, …)`
(`changelog.ts`, `changelog-pane.ts`). Skipped its `versions.json`-generation fix (already
correct here) and its version bump (this fork versions independently).

Next review: `bfdf696..upstream/master`.

## Build artifacts

`manifest.json` and `versions.json` are **generated** —
`build/esbuild-plugin-obsidian/esbuild-plugin-obsidian.mjs` regenerates both from
`package.json`'s `obsidianPlugin` field on every `bun run build:plugin` / `bun run deploy`.
Edit `package.json`; hand edits to those two files are silently overwritten.

## Callout color model

- `--callout-color` is **not** guaranteed to be an `R, G, B` triplet — per-callout
  overrides in `data.json` can hold a full CSS color (`#4caeaa`). Never wrap it in
  `rgb(var(--callout-color))`; pass it directly to functions taking a `<color>`.
  `calloutSettingsToStyles`'s `toCssColor()` guards this — do not reintroduce an
  unconditional `rgb()` wrap when porting upstream.
- `--callout-color` cascades passively (it works even in Settings renderers), but
  `--callout-icon` requires an active `setIcon()` call timed to DOM insertion. Correct
  color with a missing icon means the injection fired before or without DOM attachment.
- When debugging color/alias bugs, read the vault's `data.json` first — many "built-in"
  callouts carry explicit color/icon settings there that affect alias propagation.

## Icon registry

`src/lucide-icons.ts` bundles the full current Lucide icon set offline (from the
`lucide-static` devDependency, refreshed via `bun run sync:lucide` into
`src/lucide-icon-svgs.json`) so icons missing from Obsidian's version-pinned native set
(e.g. `mosque`, `broccoli`) still render, zero network calls — ported from the sister
`obsidian-icon-shortcodes` plugin. `registerLucideIcons()` (called once in `main.ts`'s
`onload()`) registers every non-native icon under the `callout-manager-lucide-` prefix, not
`lucide-` — Obsidian's `getIcon()`/`setIcon()` silently fail to resolve `addIcon()`-registered
entries under the native `lucide-` prefix. Storage in this repo carries icon ids both bare
(`"flame"`) and `lucide-`-prefixed (`"lucide-flame"`); `resolveLucideIconId()` normalizes
either form before every dynamic `setIcon()`/`getIcon()` call site. `manage-callouts-pane.ts`'s
`setIcon(iconEl, 'lucide-pencil')` placeholder is a static literal and intentionally left
unwrapped.

The same sync script also writes `src/lucide-icon-tags.json` (lucide-static's per-icon search
synonyms, e.g. "flask-conical" -> ["lab", "chemistry", ...] — the data lucide.dev's own icon
search runs on, also ported from icon-shortcodes). `src/ui/component/icon-suggest.ts`'s
`IconSuggest.getSuggestions()` ranks via `src/icon-search.ts`'s `rankIconSuggestions()`, name
matches first then tag matches, so typing "chem" surfaces flask-conical/atom/biohazard/etc even
though none of those names contain "chem". `icon-search.ts` has no `obsidian` import
deliberately — it's tested under both Jest and `bun test` (see Testing section) and importing
`obsidian` there would break at least one of the two runners.

## Architecture

- Panes take `CalloutStore` (`src/callout-store.ts`), not `CalloutManagerPlugin` — the
  interface is the seam. `CalloutStore` is the full write surface (`CalloutReader` +
  `AliasStore` + `IconColorAdjustStore` + CRUD) and only `ManageCalloutsPane` needs all of
  it. Read-only consumers (`InsertCalloutModal`, `apis.ts`, `api-v1.ts`) should depend on
  the narrow interfaces directly. `CalloutRepository` (`src/callout-repository.ts`) is the
  sole implementation; `main.ts` holds it as `this.repository`.
- `applyStyles` is a closure inside `onload`, not a class method — it closes over the live
  `settings` object so the `onSave` callback and the `css-change` handler share one
  function. Do not extract it.
- `determineAppearanceType` (`src/callout-appearance.ts`) splits settings into `unified`
  (single color/icon) or `complex` (conditional, duplicate-key, or any changes key beyond
  color/icon). Any UI editing color/icon inline must check `complex` first and refuse —
  see `isComplex` in `manage-callouts-pane.ts`.
- `UIPane` (`src/ui/pane.ts`) hosts one pane at a time — no stack, nav, or suspend/restore
  (removed; ADR-0001, Superseded). `ManageCalloutsPane` and `ChangelogPane` are the only
  subclasses.
- `CalloutManagerAPIs` (`src/apis.ts`) is the sole effective API-version validator;
  `main.ts`'s `newApiHandle`/`destroyApiHandle` are pass-throughs. `api/index.ts`'s
  `getApi()` types `version` as bare `string` and crosses a real plugin-to-plugin
  boundary, so this guards external input — keep it even though only `v1` exists.
- Every `Callout` is user-created; there is no built-in/theme/snippet discovery. That was
  removed deliberately in `acea84d`, not lost — `CalloutCollection` has no source-tracking
  and `Callout` has no `sources` field. See ADR-0003; reintroducing discovery was proposed
  and declined once already.
- Reachability check: grep a name across `api-v1.ts`, `apis.ts`, `api-common.ts`,
  `main.ts`, the other pane files, **and** `src/**/*.test.ts` — those are the only roots,
  and the test grep catches orphaned test doubles.

## Testing (Jest + bun, both)

Run `bun run test` (jest) **and** `bun test` (bun runner) — separate mocks, they drift.

- Babel's `@babel/preset-typescript` silently fails to strip type args on
  `new Map<T,U>()` / `new Set<T>()` used as a **class-field initializer**, throwing
  `SyntaxError: Unexpected token ','` at a wrong line number. Annotate the field instead:
  `private data: Map<K,V> = new Map();`.
- A top-level import used only in type position must be `import type`, or Babel throws
  `Cannot transform the imported binding X`. Check this when writing the first test for a
  previously-untested file.
- Two obsidian mocks exist: `__mocks__/obsidian.ts` (Jest) and `test-preload.ts`'s
  `mock.module()` (bun, richer). Add new symbols to **both**.
- Neither runner has a DOM. Code using `activeDocument` or Obsidian's DOM prototype
  extensions (`createDiv`, `createEl`, `instanceOf`) is not unit-testable without standing
  up jsdom plus polyfills — not done anywhere here.
- A module with a top-level `.md` import (esbuild's `.md: text` loader) cannot load in
  either runner. Extract testable logic out of it.

## Live testing

- `registerMarkdownPostProcessor` runs on detached elements, where `getComputedStyle` CSS
  custom properties are empty. Use a `MutationObserver` on `document.body` with
  `{ childList: true, subtree: true }` for anything that must read a var after insertion.
- CSS relative-color syntax in this Chromium build breaks when a `%` unit appears inside a
  channel `calc()`: `calc(s + 30%)` silently resolves wrong; `calc(s + 30)` works.
  Re-check with `eval` before trusting `%` here.
- `editorCallback` commands (`callout-manager:insert-callout`) need an active
  `MarkdownView`, and `executeCommandById` can return `true` with no modal present. Invoke
  directly:
  `app.commands.commands['callout-manager:insert-callout'].editorCallback(editor, view)`.
- API end-to-end:
  `app.plugins.plugins['callout-manager'].newApiHandle('v1', undefined, () => {})` returns
  the same handle a consumer plugin gets from `getApi()`.
- To find a live `.callout` element, check open leaves rather than assuming the active
  file has one:
  `app.workspace.getLeavesOfType('markdown').find(l => l.view.containerEl.querySelector('.callout'))`.
  Scheme-gated settings (e.g. `iconColorAdjust`) silently no-op against the wrong scheme —
  check `document.body.classList.contains('theme-dark')`.
