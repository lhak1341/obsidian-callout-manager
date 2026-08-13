# Graph Report - obsidian-callout-manager  (2026-08-13)

## Corpus Check
- 59 files · ~130,442 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 600 nodes · 844 edges · 118 communities (29 shown, 89 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `74b02957`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Callout Data Layer
- Manage Callouts Pane UI
- Plugin API v1
- Build Dev Dependencies
- Settings & Stylesheet Assembly
- Insert Modal & Color Utils
- Changelog & README Features
- TypeScript Config & Test Refs
- Main Plugin & Pane Navigation
- Package Manifest Metadata
- CLAUDE.md & ADR Notes
- Callout Resolver & Isolated Preview
- Dev Reloader Utility
- TSConfig Path Aliases
- Plugin API Docs & Test Gotchas
- Test Preload Mocks
- Manifest.json Fields
- Dev Reloader Manifest
- API Package TSConfig
- Esbuild Config
- CalloutStore Seam Refactor
- Insert Callout Command Pattern
- Jest Config
- Reset Button Component
- Type Helper Utilities
- Callout Color CSS Gotchas
- Appearance Complexity Guard
- Dev Screenshot Tooling
- Test Environment Limitations
- Deploy Script
- Icon Color CSS Specificity
- getComputedStyle Gotcha
- Manifest Build Artifact Note
- Markdown Import Limitation
- Modal Container Cleanup
- Orphaned Test Doubles Check
- Reachability Check Pattern
- Setting Group Styling Pattern
- Theme Switch Eval Tip
- Vault data.json Debug Tip
- IconSuggest
- ADR-0001: AppearanceEditor nav is late-bound; render() receives it as a thunk
- ADR-0002: Do not debounce saveData or decouple applyStyles from setCalloutSettings
- ADR-0003: No built-in/theme/snippet callout discovery — `Callout` has no source
- Manage Callouts Settings Pane
- CalloutManager API Handle
- CalloutSource Type
- Automatic Detection
- Callout Customization
- Callout Previews
- Color Dropdown
- Completr (plugin)
- Integration with Completr
- @decheine (contributor)
- Export Callouts as CSS
- In-App Changelogs
- Insert Callouts Feature
- More Robust Callout Detection
- Rename Callouts
- Settings Pane (Mobile) Fix
- Babel preset-typescript Map/Set Type-Args Strip Bug
- CalloutManagerAPIs
- CalloutStore Interface Seam
- ChangelogPane
- CSS Relative-Color calc() % Unit Bug
- obsidian eval Writes Straight to Real data.json (No Sandbox)
- bun run test (jest) + bun test (bun runner)
- executeCommandById Timing/Focus Unreliability
- Fork Not Published to npm/Community Store
- Type-Only Import Must Use `import type` Bug
- callout-manager:insert-callout Command
- isComplex Guard
- ManageCalloutsPane
- MutationObserver-on-document.body Pattern
- main.ts newApiHandle/destroyApiHandle
- Two Independent Obsidian Mocks (Jest + Bun)
- Plugin API End-to-End Manual Test via newApiHandle
- registerMarkdownPostProcessor Detached-DOM Gotcha
- Screenshot Crop Scale Calculation
- setCalloutSettings
- UIPane
- ADR-0001: AppearanceEditor Nav Is Late-Bound
- AppearanceEditor (deleted)
- Commit 58d7d30 (deletion commit)
- Object.defineProperties Late-Injection (rejected design)
- EditCalloutPane (deleted)
- getNav: () => UIPaneNavigation Parameter
- makeAppearanceEditor Factory Function
- UIPane (src/ui/pane.ts)
- UIPaneLayers (deleted, pane-layers.ts)
- UIPaneNavigation Thunk Type
- ADR-0002: Do Not Debounce saveData/applyStyles
- assembleStylesheet
- Debounce saveData/applyStyles Optimisation (rejected)
- onCalloutChanged
- onSave Callback
- onSetAppearance (color picker drag handler)
- saveData (Obsidian API, async)
- CalloutRepository.setCalloutSettings
- Alias Groups
- Browse and Search All Available Callouts
- Internals Restructured Around CalloutStore Seam
- Create and Manage Custom Callouts
- Development Commands (bun install/test/build/deploy)
- Edit Color and Icon Inline
- Header Color Adjuster (Per Light/Dark Mode)
- Insert Callout Command
- BRAT Installation
- Manual Installation
- MIT License
- Plugin API
- Removed Legacy Settings UI (manage-plugin pane, CSS export, reset-to-defaults)
- eth-p/obsidian-callout-manager (upstream)

## God Nodes (most connected - your core abstractions)
1. `CalloutID` - 38 edges
2. `Callout` - 26 edges
3. `compilerOptions` - 20 edges
4. `CalloutRepository` - 19 edges
5. `CalloutStore` - 18 edges
6. `CalloutCollection` - 17 edges
7. `ManageCalloutsPane` - 17 edges
8. `CalloutReader` - 15 edges
9. `PluginReloader` - 14 edges
10. `CalloutManagerAPI_V1` - 13 edges

## Surprising Connections (you probably didn't know these)
- `Per-Scheme Header Color Saturation/Lightness Adjuster` --conceptually_related_to--> `defaultSettings()`  [INFERRED]
  docs/images/screenshot_manage_pane_darklight.png → src/settings.ts
- `Callout List Row (abstract: aliases, color, icon)` --conceptually_related_to--> `ManageCalloutsPane`  [INFERRED]
  docs/images/screenshot_manage_pane_darklight.png → src/panes/manage-callouts-pane.ts
- `Manage Callouts Settings Pane` --conceptually_related_to--> `ManageCalloutsPane`  [INFERRED]
  docs/images/screenshot_manage_pane_darklight.png → src/panes/manage-callouts-pane.ts
- `PreviewOptions` --references--> `CalloutID`  [EXTRACTED]
  src/ui/component/callout-preview.ts → api/callout.ts
- `CachedCallout` --references--> `Callout`  [EXTRACTED]
  src/callout-collection.ts → api/callout.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Commit 58d7d30 Deletion Set (pane-stacking machinery removal)** — docs_adr_0001_commit_58d7d30, docs_adr_0001_appearanceeditor, docs_adr_0001_editcalloutpane, docs_adr_0001_uipanelayers [EXTRACTED 1.00]
- **Plugin API Manual Verification via newApiHandle** — claude_plugin_api_e2e_test, api_readme_getapi, api_readme_getcallouts, api_readme_getcolor, api_readme_on_change_listener [EXTRACTED 1.00]

## Communities (118 total, 89 thin omitted)

### Community 0 - "Callout Data Layer"
Cohesion: 0.09
Nodes (10): CalloutID, getApi(), isInstalled(), ObsidianAppWithPlugins, CachedCallout, CalloutCollection, CalloutRepository, CalloutSettings (+2 more)

### Community 1 - "Manage Callouts Pane UI"
Cohesion: 0.11
Nodes (15): Callout List Row (abstract: aliases, color, icon), Dark/Light Theme Comparison Composite (diagonal split), Per-Scheme Header Color Saturation/Lightness Adjuster, Manage Callouts Pane Screenshot (Dark/Light Split), Manage Callouts Settings Pane, Obsidian Settings Shell (sidebar: Options / Core plugins / Community plugins), AliasStore, CalloutStore (+7 more)

### Community 2 - "Plugin API v1"
Cohesion: 0.10
Nodes (12): Callout, CalloutManagerEvent, CalloutManagerEventListener, CalloutManagerEventMap, CalloutManager, CalloutManagerOwnedHandle, CalloutManagerUnownedHandle, destroy (+4 more)

### Community 3 - "Build Dev Dependencies"
Cohesion: 0.05
Nodes (41): @babel/preset-env, @babel/preset-typescript, builtin-modules, @coderspirit/nominal, esbuild, esbuild-plugin-alias, eslint-plugin-obsidianmd, jest (+33 more)

### Community 4 - "Settings & Stylesheet Assembly"
Cohesion: 0.11
Nodes (22): assembleIconColorAdjustCSS(), assembleStylesheet(), clamp(), DEFAULT_CALLOUT_COLORS_CSS, Appearance, ComplexAppearance, determineAppearanceType(), determineUnifiedAppearance() (+14 more)

### Community 5 - "Insert Modal & Color Utils"
Cohesion: 0.11
Nodes (15): getColorFromCallout(), getTitleFromCallout(), resolveLucideIconId(), InsertCalloutModal, CalloutPreviewComponent, HSV, HSVA, parseColor() (+7 more)

### Community 7 - "TypeScript Config & Test Refs"
Cohesion: 0.06
Nodes (31): dist/**/*, DOM, ES2017, ES2018, ES2019, ES5, ES6, ES7 (+23 more)

### Community 8 - "Main Plugin & Pane Navigation"
Cohesion: 0.08
Nodes (20): Version 1.0.0, Version 1.0.1, Version 1.1.0, Version 1.1.1, CALLOUT_ALIAS_GROUPS, CALLOUT_CANONICAL, currentCalloutEnvironment(), ChangelogSection (+12 more)

### Community 9 - "Package Manifest Metadata"
Cohesion: 0.07
Nodes (29): obsidian-extra, author, name, url, dependencies, obsidian-extra, description, keywords (+21 more)

### Community 11 - "Callout Resolver & Isolated Preview"
Cohesion: 0.12
Nodes (9): CalloutProperties, CalloutResolver, createLiveViewContainer(), createReadingViewContainer(), getCurrentStyles(), IsolatedCalloutPreviewComponent, IsolatedPreviewOptions, NO_ATTACH (+1 more)

### Community 12 - "Dev Reloader Utility"
Cohesion: 0.14
Nodes (8): FULL_RELOAD_FILES, obsidian, onload(), onunload(), overriddenStylesEl, PluginReloader, STYLE_RELOAD_FILES, watchPlugin()

### Community 13 - "TSConfig Path Aliases"
Cohesion: 0.11
Nodes (19): ./api, ./api/callout, ./src/callout-resolver, ./src/callout-settings, ./src/callout-util, ./src/main, ./src/settings, ./src/ui/* (+11 more)

### Community 14 - "Plugin API Docs & Test Gotchas"
Cohesion: 0.07
Nodes (27): `Callout`, Callout Manager Plugin API, `CalloutID`, Functions, `getApi`, `getCallouts`, `getColor`, `getTitle` (+19 more)

### Community 15 - "Test Preload Mocks"
Cohesion: 0.20
Nodes (5): css(), StubButton, StubComponent, StubSetting, StubTextInput

### Community 16 - "Manifest.json Fields"
Cohesion: 0.22
Nodes (8): author, authorUrl, description, id, isDesktopOnly, minAppVersion, name, version

### Community 17 - "Dev Reloader Manifest"
Cohesion: 0.22
Nodes (8): author, authorUrl, description, id, isDesktopOnly, minAppVersion, name, version

### Community 18 - "API Package TSConfig"
Cohesion: 0.40
Nodes (4): extends, include, *.ts, ../tsconfig.json

### Community 19 - "Esbuild Config"
Cohesion: 0.50
Nodes (3): external, aliases, tsconfig

### Community 31 - "Deploy Script"
Cohesion: 0.40
Nodes (3): OPTIONAL, REQUIRED, targets

### Community 44 - "IconSuggest"
Cohesion: 0.20
Nodes (9): rankIconSuggestions(), allLucideIconNames(), gapNames, getLucideIconTags(), nativeNames, registerLucideIcons(), scaleToCustomIconViewport(), IconSuggest (+1 more)

### Community 45 - "ADR-0001: AppearanceEditor nav is late-bound; render() receives it as a thunk"
Cohesion: 0.33
Nodes (5): ADR-0001: AppearanceEditor nav is late-bound; render() receives it as a thunk, Consequences, Context, Decision, Reasoning

### Community 46 - "ADR-0002: Do not debounce saveData or decouple applyStyles from setCalloutSettings"
Cohesion: 0.33
Nodes (5): ADR-0002: Do not debounce saveData or decouple applyStyles from setCalloutSettings, Consequences, Context, Decision, Reasoning

### Community 47 - "ADR-0003: No built-in/theme/snippet callout discovery — `Callout` has no source"
Cohesion: 0.33
Nodes (5): ADR-0003: No built-in/theme/snippet callout discovery — `Callout` has no source, Consequences, Context, Decision, Reasoning

### Community 48 - "Manage Callouts Settings Pane"
Cohesion: 0.33
Nodes (4): allTags, files, svgs, tags

## Ambiguous Edges - Review These
- `Per-Scheme Header Color Saturation/Lightness Adjuster` → `Callout List Row (abstract: aliases, color, icon)`  [AMBIGUOUS]
  docs/images/screenshot_manage_pane_darklight.png · relation: conceptually_related_to

## Knowledge Gaps
- **235 isolated node(s):** `CalloutProperties`, `ObsidianAppWithPlugins`, `extends`, `../tsconfig.json`, `*.ts` (+230 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **89 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Per-Scheme Header Color Saturation/Lightness Adjuster` and `Callout List Row (abstract: aliases, color, icon)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `paths` connect `TSConfig Path Aliases` to `TypeScript Config & Test Refs`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `&plugin` connect `TSConfig Path Aliases` to `Plugin API v1`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `compilerOptions` connect `TypeScript Config & Test Refs` to `TSConfig Path Aliases`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **What connects `CalloutProperties`, `ObsidianAppWithPlugins`, `extends` to the rest of the system?**
  _235 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Callout Data Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.09390243902439024 - nodes in this community are weakly interconnected._
- **Should `Manage Callouts Pane UI` be split into smaller, more focused modules?**
  _Cohesion score 0.1140819964349376 - nodes in this community are weakly interconnected._