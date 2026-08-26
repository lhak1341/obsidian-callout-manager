# Callout Manager (lhak fork)

Fork of `eth-p/obsidian-callout-manager`. Not published to npm or the community store —
install/dev docs should describe manual copy or BRAT, not upstream's install flow.

House conventions for Obsidian plugin repos live in the `obsidian-plugin-dev` skill —
including upstream-sync procedure, settings-tab structure, CSS specificity, and live
debugging. Repo-specific facts below; architecture detail is in `docs/ARCHITECTURE.md`,
test gotchas in `docs/TESTING.md`.

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
