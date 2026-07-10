# Callout Manager (lhak fork)

## Gotchas
- `registerMarkdownPostProcessor` runs on detached elements — `getComputedStyle` CSS custom properties are empty there (no cascade context). For anything that must read a CSS var after insertion (e.g. `--callout-icon` → `setIcon`), use a `MutationObserver` on `document.body` with `{ childList: true, subtree: true }` instead; it fires after elements are live in the DOM.
- `--callout-color` cascades passively (works even in Settings renderers like the community plugin page), but `--callout-icon` requires an active `setIcon()` call timed to DOM insertion — if color is correct but icon is missing, the injection fired before or without DOM attachment.
- `manifest.json`/`versions.json` are build artifacts — `build/esbuild-plugin-obsidian/esbuild-plugin-obsidian.mjs` regenerates both from `package.json`'s `obsidianPlugin` field on every `bun run build:plugin`/`bun run deploy`. Edit `package.json`, not those files directly; hand edits get silently overwritten on the next build. (Corrects earlier guidance here that said to edit `manifest.json` by hand — that predates the current build script.)
- `getComputedStyle().getPropertyValue('--custom-property')` returns the raw token string in Chromium (e.g. `var(--color-yellow)`), not the resolved value — propagating resolver-read values to aliases bakes in a static concrete colour that diverges from the live document.
- When debugging colour/alias bugs, read the vault data.json first (`~/.../lhakZettel/.obsidian/plugins/callout-manager/data.json`) — many "built-in" callouts have explicit colour/icon settings stored there that affect alias propagation.

## Architecture
- Panes take `CalloutStore` (`src/callout-store.ts`), not `CalloutManagerPlugin` — the interface is the seam.
- `CalloutRepository` (`src/callout-repository.ts`) is the concrete `CalloutStore`; `main.ts` holds it as `this.repository` and hands it to panes, commands, and the API layer.
- `applyStyles` is a closure inside `onload`, not a class method — it closes over the live `settings` object so the `onSave` mutation callback and the `css-change` reapply handler share the same function. Do not extract it to a method.
- Grouped `Setting` rows must be wrapped in `containerEl.createDiv('setting-group').createDiv('setting-items')` (pass the inner div to `new Setting(...)`) — otherwise Obsidian renders them without native card padding/background. See manage-callouts-pane.ts.
- `determineAppearanceType` (`src/callout-appearance.ts`) splits a callout's settings into `unified` (single color/icon) or `complex` (conditional/`data.json`-only overrides). Any UI that edits color/icon inline must check for `complex` first and refuse/warn instead of overwriting — see the guard in `manage-callouts-pane.ts` (`isComplex`).
- To check if a pane/class is reachable, grep for its name across `api-v1.ts`, `apis.ts`, `api-common.ts`, `main.ts`, and the other pane files — these are the only roots. Zero hits across all of them means it's orphaned.

## Testing
- Use `bun run test` (jest) or `bun test` (bun runner). Both pass 33 tests.
- `obsidian` npm package is type stubs only (`"main": ""`); bun's ESM resolver fails if any loaded module imports it at runtime. `bunfig.toml` preloads `test-preload.ts` which mocks both `obsidian` and `obsidian-extra` via `mock.module()`. If a new test chain reaches an unmocked `obsidian` symbol, add it to `test-preload.ts`.

## Manual testing via obsidian-cli / CDP (this vault)
- `editorCallback`-based commands (e.g. `callout-manager:insert-callout`) silently no-op via `app.commands.executeCommandById(...)` unless a real `MarkdownView` is active — open a note first.
- Even with an active editor, `executeCommandById` sometimes returns `true` but the modal it should have opened isn't present by the next `obsidian eval` call (timing/focus artifact across separate CDP round-trips). Direct invocation is reliable where the command dispatcher isn't:
  ```js
  const cmd = app.commands.commands['callout-manager:insert-callout'];
  cmd.editorCallback(app.workspace.activeEditor.editor, app.workspace.getActiveViewOfType(...));
  ```
- `document.querySelectorAll('.modal-container').forEach(m => m.remove())` before reopening a modal avoids stray leftover modals stacking across test iterations.
