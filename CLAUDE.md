# Callout Manager (lhak fork)

## Gotchas
- After changing `minAppVersion` in `package.json`, also update `manifest.json` manually — ESLint reads `manifest.json` directly and the build only regenerates it during `bun run build:plugin`.
- `getComputedStyle().getPropertyValue('--custom-property')` returns the raw token string in Chromium (e.g. `var(--color-yellow)`), not the resolved value — propagating resolver-read values to aliases bakes in a static concrete colour that diverges from the live document.
- When debugging colour/alias bugs, read the vault data.json first (`~/.../lhakZettel/.obsidian/plugins/callout-manager/data.json`) — many "built-in" callouts have explicit colour/icon settings stored there that affect alias propagation.

## Architecture
- Panes take `CalloutStore` (`src/callout-store.ts`), not `CalloutManagerPlugin` — the interface is the seam.
- Exception: `ManagePluginPane` takes `CalloutManagerPlugin` intentionally; it accesses `cssApplier`, `callouts.custom.clear()`, and raw `settings.callouts` mutation that are not on the interface.
