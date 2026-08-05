# Graph Report - .  (2026-08-05)

## Corpus Check
- Corpus is ~30,605 words - fits in a single context window. You may not need a graph.

## Summary
- 567 nodes · 918 edges · 44 communities (24 shown, 20 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 25 edges (avg confidence: 0.82)
- Token cost: 147,250 input · 0 output

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
- API Handle Lifecycle
- Icon/Color DOM Timing Gotchas
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

## God Nodes (most connected - your core abstractions)
1. `CalloutID` - 53 edges
2. `CalloutStore` - 28 edges
3. `Callout` - 27 edges
4. `CalloutRepository` - 20 edges
5. `compilerOptions` - 20 edges
6. `CalloutCollection` - 19 edges
7. `ManageCalloutsPane` - 17 edges
8. `PluginReloader` - 14 edges
9. `Callout Manager (lhak fork)` - 14 edges
10. `CalloutManagerAPI_V1` - 13 edges

## Surprising Connections (you probably didn't know these)
- `Per-Scheme Header Color Saturation/Lightness Adjuster` --conceptually_related_to--> `defaultSettings()`  [INFERRED]
  docs/images/screenshot_manage_pane_darklight.png → src/settings.ts
- `Callout List Row (abstract: aliases, color, icon)` --conceptually_related_to--> `ManageCalloutsPane`  [INFERRED]
  docs/images/screenshot_manage_pane_darklight.png → src/panes/manage-callouts-pane.ts
- `Manage Callouts Settings Pane` --conceptually_related_to--> `ManageCalloutsPane`  [INFERRED]
  docs/images/screenshot_manage_pane_darklight.png → src/panes/manage-callouts-pane.ts
- `Insert Callouts Feature` --semantically_similar_to--> `Insert Callout Command`  [INFERRED] [semantically similar]
  CHANGELOG.md → README.md
- `Color Dropdown` --semantically_similar_to--> `Edit Color and Icon Inline`  [INFERRED] [semantically similar]
  CHANGELOG.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Version 1.1.0 Release Bundle** — changelog_v1_1_0, changelog_in_app_changelogs, changelog_insert_callouts, changelog_color_dropdown, changelog_rename_callouts, changelog_more_robust_callout_detection, changelog_completr_integration [INFERRED 0.85]
- **Commit 58d7d30 Deletion Set (pane-stacking machinery removal)** — docs_adr_0001_commit_58d7d30, docs_adr_0001_appearanceeditor, docs_adr_0001_editcalloutpane, docs_adr_0001_uipanelayers [EXTRACTED 1.00]
- **Plugin API Manual Verification via newApiHandle** — claude_plugin_api_e2e_test, api_readme_getapi, api_readme_getcallouts, api_readme_getcolor, api_readme_on_change_listener [EXTRACTED 1.00]

## Communities (44 total, 20 thin omitted)

### Community 0 - "Callout Data Layer"
Cohesion: 0.07
Nodes (16): Callout, CalloutID, CalloutSource, CachedCallout, CalloutCollection, CalloutCollectionCustom, CalloutCollectionObsidian, CalloutCollectionSnippets (+8 more)

### Community 1 - "Manage Callouts Pane UI"
Cohesion: 0.09
Nodes (19): Callout List Row (abstract: aliases, color, icon), Dark/Light Theme Comparison Composite (diagonal split), Per-Scheme Header Color Saturation/Lightness Adjuster, Manage Callouts Pane Screenshot (Dark/Light Split), Manage Callouts Settings Pane, Obsidian Settings Shell (sidebar: Options / Core plugins / Community plugins), Appearance, ComplexAppearance (+11 more)

### Community 2 - "Plugin API v1"
Cohesion: 0.09
Nodes (13): CalloutManagerEvent, CalloutManagerEventListener, CalloutManagerEventMap, CalloutManager, CalloutManagerOwnedHandle, CalloutManagerUnownedHandle, getApi(), isInstalled() (+5 more)

### Community 3 - "Build Dev Dependencies"
Cohesion: 0.05
Nodes (39): @babel/preset-env, @babel/preset-typescript, builtin-modules, @coderspirit/nominal, esbuild, esbuild-plugin-alias, eslint-plugin-obsidianmd, jest (+31 more)

### Community 4 - "Settings & Stylesheet Assembly"
Cohesion: 0.09
Nodes (29): CalloutProperties, CalloutSourceCustom, CalloutSourceObsidian, CalloutSourceSnippet, CalloutSourceTheme, assembleIconColorAdjustCSS(), assembleStylesheet(), DEFAULT_CALLOUT_COLORS_CSS (+21 more)

### Community 5 - "Insert Modal & Color Utils"
Cohesion: 0.12
Nodes (14): getColorFromCallout(), getTitleFromCallout(), InsertCalloutModal, CalloutPreviewComponent, HSV, HSVA, parseColor(), parseColorHex() (+6 more)

### Community 6 - "Changelog & README Features"
Cohesion: 0.07
Nodes (32): @alythobani (contributor), Automatic Detection, Callout Customization, Callout Previews, Color Dropdown, Completr (plugin), Integration with Completr, @decheine (contributor) (+24 more)

### Community 7 - "TypeScript Config & Test Refs"
Cohesion: 0.06
Nodes (31): dist/**/*, DOM, ES2017, ES2018, ES2019, ES5, ES6, ES7 (+23 more)

### Community 8 - "Main Plugin & Pane Navigation"
Cohesion: 0.13
Nodes (9): ChangelogSection, getSections(), parseChangelogVersion(), CalloutManagerPlugin, ChangelogPane, UIPane, UIPane_FRIEND, UIPaneTitle (+1 more)

### Community 9 - "Package Manifest Metadata"
Cohesion: 0.07
Nodes (26): obsidian-extra, author, name, url, dependencies, obsidian-extra, description, keywords (+18 more)

### Community 10 - "CLAUDE.md & ADR Notes"
Cohesion: 0.10
Nodes (25): applyStyles Closure, ChangelogPane, obsidian eval Writes Straight to Real data.json (No Sandbox), ManageCalloutsPane, setCalloutSettings, UIPane, ADR-0001: AppearanceEditor Nav Is Late-Bound, AppearanceEditor (deleted) (+17 more)

### Community 11 - "Callout Resolver & Isolated Preview"
Cohesion: 0.13
Nodes (8): CalloutResolver, createLiveViewContainer(), createReadingViewContainer(), getCurrentStyles(), IsolatedCalloutPreviewComponent, IsolatedPreviewOptions, NO_ATTACH, PreviewOptions

### Community 12 - "Dev Reloader Utility"
Cohesion: 0.14
Nodes (8): FULL_RELOAD_FILES, obsidian, onload(), onunload(), overriddenStylesEl, PluginReloader, STYLE_RELOAD_FILES, watchPlugin()

### Community 13 - "TSConfig Path Aliases"
Cohesion: 0.11
Nodes (19): ./api, ./api/callout, ./src/callout-resolver, ./src/callout-settings, ./src/callout-util, ./src/main, ./src/settings, ./src/ui/* (+11 more)

### Community 14 - "Plugin API Docs & Test Gotchas"
Cohesion: 0.18
Nodes (15): Callout Type, CalloutID Type, CalloutManager API Handle, CalloutSource Type, getApi Function, getCallouts Function, getColor Function, getTitle Function (+7 more)

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

### Community 22 - "CalloutStore Seam Refactor"
Cohesion: 0.67
Nodes (3): CalloutRepository, CalloutStore Interface Seam, Internals Restructured Around CalloutStore Seam

### Community 23 - "Insert Callout Command Pattern"
Cohesion: 0.67
Nodes (3): editorCallback Command Requires Active MarkdownView, executeCommandById Timing/Focus Unreliability, callout-manager:insert-callout Command

## Ambiguous Edges - Review These
- `Per-Scheme Header Color Saturation/Lightness Adjuster` → `Callout List Row (abstract: aliases, color, icon)`  [AMBIGUOUS]
  docs/images/screenshot_manage_pane_darklight.png · relation: conceptually_related_to

## Knowledge Gaps
- **161 isolated node(s):** `CalloutProperties`, `CalloutSourceObsidian`, `CalloutSourceSnippet`, `CalloutSourceTheme`, `CalloutSourceCustom` (+156 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Per-Scheme Header Color Saturation/Lightness Adjuster` and `Callout List Row (abstract: aliases, color, icon)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `paths` connect `TSConfig Path Aliases` to `TypeScript Config & Test Refs`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `&plugin` connect `TSConfig Path Aliases` to `Plugin API v1`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `CalloutID` connect `Callout Data Layer` to `Manage Callouts Pane UI`, `Plugin API v1`, `Callout Resolver & Isolated Preview`, `Settings & Stylesheet Assembly`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **What connects `CalloutProperties`, `CalloutSourceObsidian`, `CalloutSourceSnippet` to the rest of the system?**
  _161 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Callout Data Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.06599597585513078 - nodes in this community are weakly interconnected._
- **Should `Manage Callouts Pane UI` be split into smaller, more focused modules?**
  _Cohesion score 0.08585858585858586 - nodes in this community are weakly interconnected._