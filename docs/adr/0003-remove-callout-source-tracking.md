# ADR-0003: No built-in/theme/snippet callout discovery — `Callout` has no source

**Status**: Accepted  
**Date**: 2026-08-07

## Context

Upstream's original architecture discovered callouts from four places: Obsidian's own built-in
stylesheet, the active theme, enabled CSS snippets, and callouts the user explicitly created
through the plugin ("custom"). `CalloutCollection` tracked each source independently
(`CalloutCollectionSnippets`/`Obsidian`/`Theme`/`Custom`), diffed each source's contribution on
change, and merged them into one cache keyed by callout ID — a single ID could be contributed by
more than one source at once (e.g. a theme *and* a custom override both claiming `note`).
`Callout.sources: CalloutSource[]` (part of the public plugin API) recorded which source(s)
produced each entry.

Commit `acea84d` ("Overhaul manage pane with inline editing") deleted the discovery mechanism —
`css-watcher.ts` and `css-parser.ts`, which watched Obsidian/theme/snippet stylesheets and parsed
their CSS for callout selectors — describing them in the commit message as "unused search, sort,
and css-parser modules." From that commit forward, nothing in `main.ts` ever calls
`CalloutCollection`'s `builtin`/`theme`/`snippets` trackers. Only `custom` (user-created callouts)
remained reachable.

This went unnoticed for several months:

- `CalloutCollection` itself kept full logic and test coverage for all four sources, so nothing
  looked obviously broken by reading the code.
- `README.md` kept advertising "Lists every callout Obsidian knows about — built-in,
  theme-provided, snippet-provided, and custom," which was no longer true.
- The live vault's 39 callouts were all `custom`-sourced — the user had been manually recreating
  Obsidian's real built-ins (`note`, `abstract`, `tip`, etc.) as custom callouts to be able to
  style them at all, without realizing genuine discovery no longer worked.

An architecture review surfaced the dead `CalloutCollectionSnippets`/`Obsidian`/`Theme` classes as
a "duplicated diff/invalidate pattern" worth generalizing. Investigating the call sites (not just
the code) revealed they weren't three live-but-repetitive trackers — they were three permanently
unreachable ones, with exactly one real producer (`custom`) left.

## Decision

Keep the removal. Custom-only is the intended scope going forward, not a regression to fix — a
simpler, more predictable UX (a list of callouts you explicitly manage, no auto-discovered noise
or guessing at every installed theme's callout names) is a reasonable product direction for this
fork, consistent with the rest of `acea84d`'s pane simplification.

Given that, delete the now-permanently-dead infrastructure rather than leave it in place for a
discovery feature that isn't coming back:

- `CalloutCollection` (`src/callout-collection.ts`) drops the four-source model entirely. No more
  `sourceToKey`/`sourceFromKey`, `CachedCallout.sources: Set<string>`,
  `addCalloutSource`/`removeCalloutSource`/`invalidateSource`, or `buildCache()`. It's now a flat
  `add(...ids)`/`delete(...ids)`/`get`/`has`/`keys`/`values`/`invalidate`/`hasChanged` cache — the
  multi-source-per-ID scenario that justified the indirection can no longer occur.
- `Callout.sources`/`CalloutSource` (`api/callout.ts`) are removed from the public API. `Callout`
  is now just `CalloutProperties` (`id`/`color`/`icon`). This is a public API type change; the fork
  is unpublished (no npm/community-store distribution), so the practical breakage risk is low.
- `manage-callouts-pane.ts`'s `isCustomOnly` guard, and `callout-repository.ts`'s
  "non-custom callout" rename guard, are removed — both existed only to handle sources that can no
  longer exist. Every row's rename input and delete button now apply unconditionally.
- `README.md` and `api/README.md` corrected to describe actual behavior (manages callouts you
  create; no auto-discovery).

## Reasoning

Keeping unreachable code "just in case" costs real things: it misrepresents the plugin's
capability in its own README, it carries test coverage for a scenario (multi-source overlap) that
can't happen, and — as this investigation itself demonstrates — it actively misleads future
architecture work into treating dead trackers as a live "duplicated pattern" worth generalizing,
when the real fix was deletion.

If built-in/theme/snippet discovery is wanted again later, it should be designed fresh against
what's available now (`obsidian-extra` v0.1.5+ already exposes `getThemeStyleElement`,
`getSnippetStyleElements`, `getInstalledThemeIDs`, etc. — likely a much smaller implementation than
the original 358-line `css-watcher.ts`, which predates that library's more mature API) rather than
resurrecting the deleted mechanism as-is.

## Consequences

- `Callout` has no way to express "where did this come from" — every callout the plugin knows
  about was created through it. Don't add a `sources`/`source` field back speculatively; it has no
  consumer today.
- Adding discovery back is a new feature, not a bug fix — it needs its own design (ADR, if it
  changes `Callout`'s shape again) rather than being treated as restoring lost functionality.
- `CalloutCollection.add`/`delete` are the only way callouts enter or leave the cache. There is no
  "rescan all sources" concept to preserve when changing how callouts are created.
