# Callout Manager (lhak fork)

## Gotchas
- After changing `minAppVersion` in `package.json`, also update `manifest.json` manually — ESLint reads `manifest.json` directly and the build only regenerates it during `bun run build:plugin`.
