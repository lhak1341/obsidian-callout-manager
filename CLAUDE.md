# Callout Manager (lhak fork)

## Gotchas
- After changing `minAppVersion` in `package.json`, also update `manifest.json` manually — ESLint reads `manifest.json` directly and the build only regenerates it during `bun run build:plugin`.

## Architecture
- Panes take `CalloutStore` (`src/callout-store.ts`), not `CalloutManagerPlugin` — the interface is the seam.
- Exception: `ManagePluginPane` takes `CalloutManagerPlugin` intentionally; it accesses `cssApplier`, `callouts.custom.clear()`, and raw `settings.callouts` mutation that are not on the interface.
