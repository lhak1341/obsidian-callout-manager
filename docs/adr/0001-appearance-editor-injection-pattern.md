# ADR-0001: AppearanceEditor nav is late-bound; render() receives it as a thunk

**Status**: Superseded  
**Date**: 2026-07-03  
**Updated**: 2026-07-26 — superseded: `AppearanceEditor`/`EditCalloutPane` (this ADR's subject) were deleted in
commit `58d7d30`, and the `nav`/`UIPaneNavigation` thunk mechanism itself (along with the rest of the unused
pane-stacking machinery — `UIPaneLayers.push`/`pop`, suspend/restore, friend-injection) was deleted from
`src/ui/pane.ts` and `src/ui/pane-layers.ts` after a grep across every pane confirmed zero live callers. `UIPane`
is single-layer only now; see `src/ui/paned-setting-tab.ts`.

## Context

`EditCalloutPane` calls `render()` on an appearance editor from its own
constructor (via `changeSettings`). The pane extends `UIPane`, whose `nav`
field is set by the pane framework **after** the constructor runs. `nav` is
therefore `undefined` at the point `render()` is first called.

Appearance editors need `nav` to push navigation actions (e.g. the icon
picker), but only lazily — at user-interaction time, not at render time.

An earlier design used `Object.defineProperties` to inject `nav` as a live
getter onto each editor instance after construction. That injection protocol was
considered for replacement with constructor injection, but rejected: `nav` is
`undefined` at construction time so it cannot be a constructor argument, and a
partial migration (injecting only the non-nav fields via constructor) reduced
the `!`-assertion surface only marginally while adding constructor signatures to
every concrete subclass.

## Decision

Replace the abstract-class injection protocol with a factory function.
`AppearanceEditor` is no longer an abstract class. `makeAppearanceEditor(appearance)`
returns a plain `AppearanceEditorImpl` object. `render()` receives `nav` as a
thunk — `getNav: () => UIPaneNavigation` — so it resolves lazily at
interaction time rather than at render time.

## Reasoning

A thunk satisfies the same timing constraint as the getter without requiring
post-construction injection. The call site is explicit about the late-binding:

```typescript
editor.render(container, callout, () => this.nav, store, onSet);
```

`() => this.nav` closes over the pane's live `nav` field. By the time the user
triggers a navigation action, the framework has set `this.nav` and the thunk
resolves correctly. At render time (when `this.nav` is still `undefined`) the
thunk is passed but never invoked.

This eliminates the `!`-asserted fields on both the editor instances and
`EditCalloutPane` itself (`appearanceEditor!`, `appearance!`), makes every
editor independently constructable without a pane framework, and keeps
the factory as the single seam: one export (`makeAppearanceEditor`), no
registry, no abstract class.

## Consequences

- `makeAppearanceEditor(appearance)` is the authoritative entry point for
  creating an editor. To add a new appearance type, add a branch to the factory
  function (exhaustiveness-checked by TypeScript's switch).
- `render()` always receives `getNav: () => UIPaneNavigation`. Never pass the
  nav value directly — it may be `undefined` when `render()` is first called
  from the pane constructor.
- Editors are independently constructable and testable without a pane framework:
  call the factory, then call `render()` with a stub container and a thunk that
  returns a mock nav.
- `EditCalloutPane` no longer holds `appearanceEditor` or `appearance` as
  fields; the editor object is local to each call site.
