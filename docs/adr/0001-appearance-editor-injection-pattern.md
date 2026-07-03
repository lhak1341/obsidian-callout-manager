# ADR-0001: AppearanceEditor uses late-bound field injection, not constructor injection

**Status**: Accepted  
**Date**: 2026-07-03

## Context

`AppearanceEditor<T>` is an abstract base class for callout appearance editors
(`UnifiedAppearanceEditor`, `ComplexAppearanceEditor`). Its fields — `plugin`,
`nav`, `callout`, `appearance`, `containerEl`, `setAppearance` — are declared
with TypeScript's definite-assignment assertion (`!`) and injected by
`EditCalloutPane` after instantiation via `Object.defineProperties`.

This looks like a candidate for constructor injection: pass an
`AppearanceEditorContext` to the constructor so TypeScript enforces completeness
at the call site and editors become independently constructable.

## Decision

Do not replace the injection protocol with constructor injection.

## Reasoning

`nav` is the load-bearing constraint. `EditCalloutPane` extends `UIPane`, whose
`nav` field is set by the pane framework **after** the pane's constructor runs —
the same late-binding pattern `UIPane` uses for its own `nav`, `containerEl`,
`controlsEl`, and `root` fields. `AppearanceEditor` inherits this timing
constraint because `render()` is called from the `EditCalloutPane` constructor
(via `changeSettings`), and anything that needs `nav` for navigation must
resolve it lazily.

For this reason `nav` is wired as a live getter — `{ get: () => this.nav }` —
not a value. It cannot be a constructor argument because it is `undefined` at
construction time.

Once `nav` must stay as a late-bound getter, a move to constructor injection
would be partial: `plugin`, `containerEl`, and `setAppearance` could move to
the constructor, but `nav`, `callout`, and `appearance` (the last two are
legitimately mutable across `changeAppearanceEditor` calls) would remain
injected. The partial improvement requires changing the `APPEARANCE_EDITORS`
registry type and adding constructor signatures to all concrete subclasses for
limited reduction in the `!` surface.

The `!` pattern is intentional and consistent with the framework: `UIPane`
itself declares `nav`, `containerEl`, `controlsEl`, and `root` as
`protected readonly field!: Type`. `AppearanceEditor` mirrors this by design.

## Consequences

- The `Object.defineProperties` injection protocol in `changeAppearanceEditor`
  stays as the authoritative initialisation path.
- Any new `AppearanceEditor` subclass must be registered in `APPEARANCE_EDITORS`
  with a zero-argument constructor.
- `nav` must always be wired as a getter (not a value) so it resolves against
  the live `EditCalloutPane.nav` after the framework sets it.
