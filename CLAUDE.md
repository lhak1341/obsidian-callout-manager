# Callout Manager (lhak fork)

## Gotchas
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
