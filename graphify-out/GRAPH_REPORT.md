# Graph Report - obsidian-callout-manager  (2026-09-09)

## Corpus Check
- 64 files · ~131,134 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 692 nodes · 883 edges · 195 communities (36 shown, 159 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1048217b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Plugin API v1
- Settings & Stylesheet Assembly
- Build Dev Dependencies
- Manage Callouts Pane UI
- Callout Resolver & Isolated Preview
- Main Plugin & Pane Navigation
- TypeScript Config & Test Refs
- Package Manifest Metadata
- Icon Registry Gotchas & Testability
- Dev Reloader Utility
- Plugin API Events & Handles
- Plugin API Docs & Callout Types
- TSConfig Path Aliases
- Callout Data Layer
- README Overview & Dev Commands
- CLAUDE.md Architecture & Testing Notes
- Insert Modal & Color Utils
- Upstream Sync & Cherry-Picked Fixes
- Test Preload Mocks
- Callout Color Model Gotchas
- CalloutStore Seam & Repository
- Manifest Fields (schema A)
- Manifest Fields (schema B)
- ADR-0003: Discovery Removal
- Build Artifact Generation
- ADR-0001: AppearanceEditor Nav Thunk
- ADR-0002: No Debounced Save
- Lucide Icon Sync Script
- TSConfig Extends/Include
- Build Config Aliases
- Changelog Version History
- CalloutStore Interface Composition
- Deploy Script Targets
- Live Testing Vault Gotchas
- Fork Identity & Install Docs
- Jest Config Options
- API Common Symbols
- Callout Alias Groups
- Reset Button Component
- Type Helper Utilities
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- CalloutID type (string alias)
- CalloutManager<T> handle type
- getApi(owner?: Plugin) function
- getColor(callout) function
- getTitle(callout) function
- API Installation section
- Every callout returned was created through Callout Manager — no discovery of built-in/theme/snippet callouts
- npm install obsidian-callout-manager
- off("change", listener) event
- on("change", listener) event
- Recommended pattern: get handle under app.workspace.onLayoutReady callback
- RGB return type of getColor
- API Setup section (get an API handle)
- CLAUDE.md — Callout Manager (lhak fork)
- Commit acea84d — removed built-in/theme/snippet discovery
- ADR-0003 — reintroducing discovery declined
- API end-to-end test via newApiHandle('v1', ...)
- applyStyles closure inside onload (not extracted to method)
- Cherry-picked fix: --callout-color needs full rgb()/CSS color
- --callout-icon requires active setIcon() call
- callout-manager-lucide- icon prefix (not lucide-)
- callout-preview.ts
- callout-settings.ts
- callout-util.ts
- CalloutCollection has no source-tracking; Callout has no sources field
- CalloutManagerAPIs (src/apis.ts)
- CalloutPreviewComponent
- CalloutRepository (src/callout-repository.ts)
- CalloutResolver's hidden probe (needs unresolved empty icon)
- CalloutStore as architectural seam
- CalloutStore = CalloutReader + AliasStore + IconColorAdjustStore + CRUD
- changelog-pane.ts
- changelog.ts
- ChangelogPane
- CalloutRepository.createCustomCallout has no duplicate-id guard
- CSS relative-color % unit inside calc() resolves wrong in this Chromium build
- Per-callout color/icon overrides in data.json
- Debug color/alias bugs by reading vault's data.json first
- DEFAULT_ICON_ID ('lucide-pencil')
- bun run deploy
- determineAppearanceType (src/callout-appearance.ts)
- Neither test runner has a DOM (activeDocument, createDiv, createEl, instanceOf untestable)
- editorCallback commands need active MarkdownView; executeCommandById can return true with no modal
- build/esbuild-plugin-obsidian/esbuild-plugin-obsidian.mjs
- getIcon()/setIcon() fail to resolve addIcon()-registered entries under native lucide- prefix
- graphify-out/ directory
- icon-reinjection.ts's IconReinjector
- icon-search.ts deliberately has no obsidian import (dual-runner testability)
- icon-suggest.ts
- iconColorAdjust silently no-ops against wrong theme scheme
- iconIdForRender(id)
- Type-only top-level imports must use import type
- Install/dev docs must describe manual copy or BRAT, not upstream flow
- isComplex in manage-callouts-pane.ts
- src/lucide-icon-svgs.json
- src/lucide-icon-tags.json
- src/lucide-icons.ts
- lucide-static devDependency
- main.ts's this.repository
- ManageCalloutsPane
- manifest.json (generated)
- Cherry-picked fix: MarkdownRenderer.renderMarkdown -> .render(app, …)
- Module with top-level .md import cannot load in either runner
- __mocks__/obsidian.ts (Jest mock)
- MutationObserver on document.body for post-insertion CSS var reads
- main.ts's newApiHandle/destroyApiHandle pass-throughs
- Next review target: bfdf696..upstream/master
- obsidian-icon-shortcodes sister plugin
- obsidian-plugin-dev skill (house conventions)
- package.json obsidianPlugin field
- Reachability check grep roots (api-v1.ts, apis.ts, api-common.ts, main.ts, panes, *.test.ts)
- Read-only consumers: InsertCalloutModal, apis.ts, api-v1.ts
- registerMarkdownPostProcessor runs on detached elements (getComputedStyle vars empty)
- renameCustomCallout (throws on duplicate)
- setIcon() must be timed to DOM insertion
- bun run sync:lucide
- test-preload.ts's mock.module() (bun mock)
- Dual test runners: bun run test (jest) and bun test (bun runner)
- UIPane (src/ui/pane.ts)
- No upstream remote configured by default
- Skipped upstream's version bump (fork versions independently)
- versions.json (generated)
- Skipped upstream's versions.json-generation fix (already correct here)
- Callout.sources / CalloutSource (removed from public API)
- CalloutCollection four-source model (removed)
- css-watcher.ts / css-parser.ts (deleted discovery mechanism)
- Decision: keep custom-only scope
- Lesson: investigate call sites, not just code, before generalizing
- isCustomOnly guard / non-custom rename guard (removed)
- obsidian-extra library (future discovery path)
- Internals restructured around a CalloutStore seam so panes don't depend on the plugin class
- scripts/deploy.mjs
- Obsidian plugin for browsing, customizing, and creating callouts
- bun run build (typecheck + production bundle)
- bun run deploy (build + copy into configured vault)
- bun install
- bun run test (jest, 33 tests)
- Feature: alias groups (color/icon change propagates to aliases)
- Feature: browse and search callouts (name/color/icon)
- Feature: create and manage custom callouts
- Feature: edit color and icon inline (with autocomplete)
- Feature: header color adjuster per light/dark mode
- Feature: Insert Callout command (and ribbon icon)
- Feature: Plugin API for other plugins to query the callout list
- Personal fork of eth-p/obsidian-callout-manager, diverged enough to be treated as separate plugin
- BRAT install: add repo as beta plugin via Obsidian42 - BRAT
- Manual install: download main.js/styles.css/manifest.json into vault plugins dir
- MIT License, © 2023 eth-p
- Screenshot: docs/images/screenshot_manage_pane_darklight.png
- What changed from upstream: removed manage-plugin pane/CSS export/reset-to-defaults in favor of one denser pane

## God Nodes (most connected - your core abstractions)
1. `CalloutID` - 38 edges
2. `Callout` - 27 edges
3. `compilerOptions` - 20 edges
4. `CalloutRepository` - 19 edges
5. `CalloutStore` - 18 edges
6. `ManageCalloutsPane` - 17 edges
7. `CalloutCollection` - 16 edges
8. `CalloutReader` - 15 edges
9. `PluginReloader` - 14 edges
10. `CalloutManagerAPI_V1` - 13 edges

## Surprising Connections (you probably didn't know these)
- `Callout List Row (abstract: aliases, color, icon)` --conceptually_related_to--> `ManageCalloutsPane`  [INFERRED]
  docs/images/screenshot_manage_pane_darklight.png → src/panes/manage-callouts-pane.ts
- `Manage Callouts Settings Pane` --conceptually_related_to--> `ManageCalloutsPane`  [INFERRED]
  docs/images/screenshot_manage_pane_darklight.png → src/panes/manage-callouts-pane.ts
- `Per-Scheme Header Color Saturation/Lightness Adjuster` --conceptually_related_to--> `defaultSettings()`  [INFERRED]
  docs/images/screenshot_manage_pane_darklight.png → src/settings.ts
- `PreviewOptions` --references--> `CalloutID`  [EXTRACTED]
  src/ui/component/callout-preview.ts → api/callout.ts
- `CachedCallout` --references--> `Callout`  [EXTRACTED]
  src/callout-collection.ts → api/callout.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **DOM-insertion timing pattern for CSS vars and icons** — claude_md_callout_icon_css_var, claude_md_seticon_dom_timing, claude_md_registermarkdownpostprocessor_detached, claude_md_mutationobserver_pattern [INFERRED 0.80]
- **Lucide icon id resolution pattern** — claude_md_resolvelucideiconid, claude_md_default_icon_id, claude_md_iconidforrender, claude_md_callout_manager_lucide_prefix [EXTRACTED 1.00]
- **No built-in callout discovery design decision** — claude_md_acea84d_commit, claude_md_calloutcollection_no_source_tracking, api_readme_md_no_discovery_note, readme_md_feature_browse_search [INFERRED 0.85]
- **Commit 58d7d30 Deletion Set (pane-stacking machinery removal)** — docs_adr_0001_commit_58d7d30, docs_adr_0001_appearanceeditor, docs_adr_0001_editcalloutpane, docs_adr_0001_uipanelayers [EXTRACTED 1.00]

## Communities (195 total, 159 thin omitted)

### Community 0 - "Plugin API v1"
Cohesion: 0.10
Nodes (15): Appearance, ComplexAppearance, determineAppearanceType(), determineUnifiedAppearance(), UnifiedAppearance, unifiedAppearanceToSettings(), AliasStore, CalloutStore (+7 more)

### Community 1 - "Settings & Stylesheet Assembly"
Cohesion: 0.07
Nodes (28): CalloutID, assembleIconColorAdjustCSS(), assembleStylesheet(), clamp(), DEFAULT_CALLOUT_COLORS_CSS, CALLOUT_ALIAS_GROUPS, CachedCallout, CalloutCollection (+20 more)

### Community 2 - "Build Dev Dependencies"
Cohesion: 0.05
Nodes (41): @babel/preset-env, @babel/preset-typescript, builtin-modules, @coderspirit/nominal, esbuild, esbuild-plugin-alias, eslint-plugin-obsidianmd, jest (+33 more)

### Community 3 - "Manage Callouts Pane UI"
Cohesion: 0.10
Nodes (20): Callout List Row (abstract: aliases, color, icon), Dark/Light Theme Comparison Composite (diagonal split), Per-Scheme Header Color Saturation/Lightness Adjuster, Manage Callouts Pane Screenshot (Dark/Light Split), Manage Callouts Settings Pane, Obsidian Settings Shell (sidebar: Options / Core plugins / Community plugins), currentCalloutEnvironment(), IconReinjector (+12 more)

### Community 4 - "Callout Resolver & Isolated Preview"
Cohesion: 0.10
Nodes (11): CalloutResolver, CalloutPreviewComponent, createLiveViewContainer(), createReadingViewContainer(), getCurrentStyles(), IsolatedCalloutPreviewComponent, IsolatedPreviewOptions, NO_ATTACH (+3 more)

### Community 5 - "Main Plugin & Pane Navigation"
Cohesion: 0.11
Nodes (13): Version 1.0.0, Version 1.0.1, Version 1.1.0, Version 1.1.1, ChangelogSection, getSections(), parseChangelogVersion(), CalloutManagerPlugin (+5 more)

### Community 6 - "TypeScript Config & Test Refs"
Cohesion: 0.06
Nodes (31): dist/**/*, DOM, ES2017, ES2018, ES2019, ES5, ES6, ES7 (+23 more)

### Community 7 - "Package Manifest Metadata"
Cohesion: 0.07
Nodes (29): obsidian-extra, author, name, url, dependencies, obsidian-extra, description, keywords (+21 more)

### Community 9 - "Dev Reloader Utility"
Cohesion: 0.14
Nodes (8): FULL_RELOAD_FILES, obsidian, onload(), onunload(), overriddenStylesEl, PluginReloader, STYLE_RELOAD_FILES, watchPlugin()

### Community 10 - "Plugin API Events & Handles"
Cohesion: 0.08
Nodes (16): Callout, CalloutProperties, CalloutManagerEvent, CalloutManagerEventListener, CalloutManagerEventMap, CalloutManager, CalloutManagerOwnedHandle, CalloutManagerUnownedHandle (+8 more)

### Community 12 - "TSConfig Path Aliases"
Cohesion: 0.11
Nodes (19): ./api, ./api/callout, ./src/callout-resolver, ./src/callout-settings, ./src/callout-util, ./src/main, ./src/settings, ./src/ui/* (+11 more)

### Community 13 - "Callout Data Layer"
Cohesion: 0.08
Nodes (22): `Callout`, Callout Manager Plugin API, `CalloutID`, Functions, `getApi`, `getCallouts`, `getColor`, `getTitle` (+14 more)

### Community 16 - "Insert Modal & Color Utils"
Cohesion: 0.15
Nodes (15): filterAndSortCallouts(), FilterAndSortCalloutsOptions, getColorFromCallout(), getTitleFromCallout(), InsertCalloutModal, attachRovingTabindex(), RovingTabindexActivation, RovingTabindexHandle (+7 more)

### Community 18 - "Test Preload Mocks"
Cohesion: 0.20
Nodes (5): css(), StubButton, StubComponent, StubSetting, StubTextInput

### Community 21 - "Manifest Fields (schema A)"
Cohesion: 0.22
Nodes (8): author, authorUrl, description, id, isDesktopOnly, minAppVersion, name, version

### Community 22 - "Manifest Fields (schema B)"
Cohesion: 0.22
Nodes (8): author, authorUrl, description, id, isDesktopOnly, minAppVersion, name, version

### Community 25 - "ADR-0001: AppearanceEditor Nav Thunk"
Cohesion: 0.33
Nodes (5): ADR-0001: AppearanceEditor nav is late-bound; render() receives it as a thunk, Consequences, Context, Decision, Reasoning

### Community 26 - "ADR-0002: No Debounced Save"
Cohesion: 0.33
Nodes (5): ADR-0002: Do not debounce saveData or decouple applyStyles from setCalloutSettings, Consequences, Context, Decision, Reasoning

### Community 27 - "Lucide Icon Sync Script"
Cohesion: 0.33
Nodes (4): allTags, files, svgs, tags

### Community 28 - "TSConfig Extends/Include"
Cohesion: 0.40
Nodes (4): extends, include, *.ts, ../tsconfig.json

### Community 29 - "Build Config Aliases"
Cohesion: 0.50
Nodes (3): external, aliases, tsconfig

### Community 30 - "Changelog Version History"
Cohesion: 0.33
Nodes (5): ADR-0003: No built-in/theme/snippet callout discovery — `Callout` has no source, Consequences, Context, Decision, Reasoning

### Community 32 - "Deploy Script Targets"
Cohesion: 0.40
Nodes (3): OPTIONAL, REQUIRED, targets

### Community 36 - "API Common Symbols"
Cohesion: 0.40
Nodes (4): Architecture, Callout color model, Icon registry, Structure

### Community 37 - "Callout Alias Groups"
Cohesion: 0.50
Nodes (3): Live testing in the vault, Testing, Unit tests (Jest + bun, both)

## Ambiguous Edges - Review These
- `Per-Scheme Header Color Saturation/Lightness Adjuster` → `Callout List Row (abstract: aliases, color, icon)`  [AMBIGUOUS]
  docs/images/screenshot_manage_pane_darklight.png · relation: conceptually_related_to

## Knowledge Gaps
- **306 isolated node(s):** `CalloutProperties`, `ObsidianAppWithPlugins`, `extends`, `../tsconfig.json`, `*.ts` (+301 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **159 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Per-Scheme Header Color Saturation/Lightness Adjuster` and `Callout List Row (abstract: aliases, color, icon)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `paths` connect `TSConfig Path Aliases` to `TypeScript Config & Test Refs`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `&plugin` connect `TSConfig Path Aliases` to `Plugin API Events & Handles`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `compilerOptions` connect `TypeScript Config & Test Refs` to `TSConfig Path Aliases`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `CalloutProperties`, `ObsidianAppWithPlugins`, `extends` to the rest of the system?**
  _306 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Plugin API v1` be split into smaller, more focused modules?**
  _Cohesion score 0.10476190476190476 - nodes in this community are weakly interconnected._
- **Should `Settings & Stylesheet Assembly` be split into smaller, more focused modules?**
  _Cohesion score 0.07130333138515488 - nodes in this community are weakly interconnected._