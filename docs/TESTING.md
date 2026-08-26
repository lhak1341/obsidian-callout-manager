# Testing

## Unit tests (Jest + bun, both)

Run `bun run test` (jest) **and** `bun test` (bun runner) — separate mocks, they drift.

- Babel's `@babel/preset-typescript` silently fails to strip type args on
  `new Map<T,U>()` / `new Set<T>()` used as a **class-field initializer**, throwing
  `SyntaxError: Unexpected token ','` at a wrong line number. Annotate the field instead:
  `private data: Map<K,V> = new Map();`.
- A top-level import used only in type position must be `import type`, or Babel throws
  `Cannot transform the imported binding X`. Check this when writing the first test for a
  previously-untested file.
- Two obsidian mocks exist: `__mocks__/obsidian.ts` (Jest) and `test-preload.ts`'s
  `mock.module()` (bun, richer). Add new symbols to **both**.
- Neither runner has a DOM. Code using `activeDocument` or Obsidian's DOM prototype
  extensions (`createDiv`, `createEl`, `instanceOf`) is not unit-testable without standing
  up jsdom plus polyfills — not done anywhere here.
- A module with a top-level `.md` import (esbuild's `.md: text` loader) cannot load in
  either runner. Extract testable logic out of it.
- A class that only stores `App`/callbacks (never calls into them) needs no real mock: cast
  `{} as App`, pass `jest.fn()` spies for constructor callbacks, and build real settings via
  `defaultSettings()` — see `callout-repository.test.ts`/`api-v1.test.ts`/
  `callout-collection.test.ts`.

## Live testing in the vault

- `registerMarkdownPostProcessor` runs on detached elements, where `getComputedStyle` CSS
  custom properties are empty. Use a `MutationObserver` on `document.body` with
  `{ childList: true, subtree: true }` for anything that must read a var after insertion.
- CSS relative-color syntax in this Chromium build breaks when a `%` unit appears inside a
  channel `calc()`: `calc(s + 30%)` silently resolves wrong; `calc(s + 30)` works. Re-check
  with `eval` before trusting `%` here.
- `editorCallback` commands (`callout-manager:insert-callout`) need an active
  `MarkdownView`, and `executeCommandById` can return `true` with no modal present. Invoke
  directly:
  `app.commands.commands['callout-manager:insert-callout'].editorCallback(editor, view)`.
- API end-to-end:
  `app.plugins.plugins['callout-manager'].newApiHandle('v1', undefined, () => {})` returns
  the same handle a consumer plugin gets from `getApi()`.
- To find a live `.callout` element, check open leaves rather than assuming the active file
  has one:
  `app.workspace.getLeavesOfType('markdown').find(l => l.view.containerEl.querySelector('.callout'))`.
- Scheme-gated settings (e.g. `iconColorAdjust`) silently no-op against the wrong scheme —
  check `document.body.classList.contains('theme-dark')`.
