# Callout Manager (lhak fork)

## Gotchas
- `registerMarkdownPostProcessor` runs on detached elements — `getComputedStyle` CSS custom properties are empty there (no cascade context). For anything that must read a CSS var after insertion (e.g. `--callout-icon` → `setIcon`), use a `MutationObserver` on `document.body` with `{ childList: true, subtree: true }` instead; it fires after elements are live in the DOM.
- `--callout-color` cascades passively (works even in Settings renderers like the community plugin page), but `--callout-icon` requires an active `setIcon()` call timed to DOM insertion — if color is correct but icon is missing, the injection fired before or without DOM attachment.
- After changing `minAppVersion` in `package.json`, also update `manifest.json` manually — ESLint reads `manifest.json` directly and the build only regenerates it during `bun run build:plugin`.
- `getComputedStyle().getPropertyValue('--custom-property')` returns the raw token string in Chromium (e.g. `var(--color-yellow)`), not the resolved value — propagating resolver-read values to aliases bakes in a static concrete colour that diverges from the live document.
- When debugging colour/alias bugs, read the vault data.json first (`~/.../lhakZettel/.obsidian/plugins/callout-manager/data.json`) — many "built-in" callouts have explicit colour/icon settings stored there that affect alias propagation.

## Architecture
- Panes take `CalloutStore` (`src/callout-store.ts`), not `CalloutManagerPlugin` — the interface is the seam.
- `CalloutRepository` (`src/callout-repository.ts`) is the concrete `CalloutStore`; `main.ts` holds it as `this.repository` and hands it to panes, commands, and the API layer.
- `applyStyles` is a closure inside `onload`, not a class method — it closes over the live `settings` object so the `onSave` mutation callback and the `css-change` reapply handler share the same function. Do not extract it to a method.

## Testing
- Use `bun run test` (jest) or `bun test` (bun runner). Both pass 33 tests.
- `obsidian` npm package is type stubs only (`"main": ""`); bun's ESM resolver fails if any loaded module imports it at runtime. `bunfig.toml` preloads `test-preload.ts` which mocks both `obsidian` and `obsidian-extra` via `mock.module()`. If a new test chain reaches an unmocked `obsidian` symbol, add it to `test-preload.ts`.
