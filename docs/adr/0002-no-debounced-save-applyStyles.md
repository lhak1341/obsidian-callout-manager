# ADR-0002: Do not debounce saveData or decouple applyStyles from setCalloutSettings

**Status**: Rejected  
**Date**: 2026-07-03

## Context

Every call to `setCalloutSettings` in `CalloutRepository` synchronously:

1. Invalidates the in-memory callout collection
2. Calls `onSave`, which runs `applyStyles()` (assembles and injects the full CSS stylesheet) and fires `saveData` (async, not awaited)
3. Calls `onCalloutChanged`, which emits an API event to registered consumers

The edit pane's color picker triggers `setCalloutSettings` on every drag tick via
`onSetAppearance` → `setCalloutSettings`. This means `applyStyles()` and a
`saveData` call fire on every pixel of a color drag.

A potential optimisation would be to:
- Apply CSS immediately (cheap) but debounce `saveData` to batch disk writes
- Emit API events only after the debounced save, not on every tick
- Introduce an explicit seam between "apply stylesheet" and "persist settings"

## Decision

Do not implement the debounce optimisation.

## Reasoning

`saveData` is already async and not awaited — there is no synchronous disk block
per tick today. The only per-tick synchronous cost is `applyStyles()`: pure JS
stylesheet assembly followed by a CSS style tag update.

At observed callout counts (10–50), no jank has been seen while dragging the
color picker. Before splitting these concerns, jank must be observed and
profiled — otherwise the refactor adds complexity (debounce timer, event
sequencing, new seam between apply and persist) with no measurable benefit.

## Consequences

- `setCalloutSettings` stays as the single call that applies styles, saves, and
  emits events together.
- If drag jank is observed in the future, profile first: measure whether
  `assembleStylesheet`, CSS injection, or `saveData` concurrency is the
  bottleneck before choosing a remedy. Debouncing `saveData` is likely the fix
  for disk pressure; debouncing `applyStyles` (with immediate feedback on mouse
  up) is the fix for style-recalculation jank.
