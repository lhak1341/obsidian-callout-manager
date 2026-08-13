# Graph Report - .  (2026-08-14)

## Corpus Check
- 32 files · ~130,962 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 652 nodes · 903 edges · 77 communities (38 shown, 39 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.83)
- Token cost: 105,481 input · 0 output

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

## God Nodes (most connected - your core abstractions)
1. `CLAUDE.md — Callout Manager (lhak fork)` - 21 edges
2. `compilerOptions` - 20 edges
3. `CalloutRepository` - 18 edges
4. `CalloutStore` - 18 edges
5. `README.md — Callout Manager (lhak fork)` - 18 edges
6. `CalloutID` - 17 edges
7. `ManageCalloutsPane` - 16 edges
8. `Callout` - 15 edges
9. `CalloutCollection` - 15 edges
10. `CalloutReader` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Manage Callouts Settings Pane` --conceptually_related_to--> `ManageCalloutsPane`  [INFERRED]
  docs/images/screenshot_manage_pane_darklight.png → src/panes/manage-callouts-pane.ts
- `Callout List Row (abstract: aliases, color, icon)` --conceptually_related_to--> `ManageCalloutsPane`  [INFERRED]
  docs/images/screenshot_manage_pane_darklight.png → src/panes/manage-callouts-pane.ts
- `Per-Scheme Header Color Saturation/Lightness Adjuster` --conceptually_related_to--> `defaultSettings()`  [INFERRED]
  docs/images/screenshot_manage_pane_darklight.png → src/settings.ts
- `Personal fork of eth-p/obsidian-callout-manager, diverged enough to be treated as separate plugin` --semantically_similar_to--> `Fork of eth-p/obsidian-callout-manager`  [INFERRED] [semantically similar]
  README.md → CLAUDE.md
- `Feature: alias groups (color/icon change propagates to aliases)` --semantically_similar_to--> `Debug color/alias bugs by reading vault's data.json first`  [INFERRED] [semantically similar]
  README.md → CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **DOM-insertion timing pattern for CSS vars and icons** — claude_md_callout_icon_css_var, claude_md_seticon_dom_timing, claude_md_registermarkdownpostprocessor_detached, claude_md_mutationobserver_pattern [INFERRED 0.80]
- **Lucide icon id resolution pattern** — claude_md_resolvelucideiconid, claude_md_default_icon_id, claude_md_iconidforrender, claude_md_callout_manager_lucide_prefix [EXTRACTED 1.00]
- **No built-in callout discovery design decision** — claude_md_acea84d_commit, claude_md_calloutcollection_no_source_tracking, api_readme_md_no_discovery_note, readme_md_feature_browse_search [INFERRED 0.85]
- **No-discovery architecture across docs** — docs_adr_0003_remove_callout_source_tracking_adr, docs_adr_0003_remove_callout_source_tracking_calloutcollection, claude_no_builtin_discovery, api_readme_no_discovery_note, readme_browse_search_callouts [INFERRED 0.85]
- **Commit 58d7d30 Deletion Set (pane-stacking machinery removal)** — docs_adr_0001_commit_58d7d30, docs_adr_0001_appearanceeditor, docs_adr_0001_editcalloutpane, docs_adr_0001_uipanelayers [EXTRACTED 1.00]

## Communities (77 total, 39 thin omitted)

### Community 0 - "Plugin API v1"
Cohesion: 0.08
Nodes (19): Callout, CalloutProperties, CalloutManagerAPI_V1, filterAndSortCallouts(), FilterAndSortCalloutsOptions, AliasStore, CalloutReader, CalloutStore (+11 more)

### Community 1 - "Settings & Stylesheet Assembly"
Cohesion: 0.06
Nodes (28): assembleIconColorAdjustCSS(), assembleStylesheet(), clamp(), DEFAULT_CALLOUT_COLORS_CSS, Appearance, ComplexAppearance, determineAppearanceType(), determineUnifiedAppearance() (+20 more)

### Community 2 - "Build Dev Dependencies"
Cohesion: 0.05
Nodes (41): @babel/preset-env, @babel/preset-typescript, builtin-modules, @coderspirit/nominal, esbuild, esbuild-plugin-alias, eslint-plugin-obsidianmd, jest (+33 more)

### Community 3 - "Manage Callouts Pane UI"
Cohesion: 0.10
Nodes (20): Callout List Row (abstract: aliases, color, icon), Dark/Light Theme Comparison Composite (diagonal split), Per-Scheme Header Color Saturation/Lightness Adjuster, Manage Callouts Pane Screenshot (Dark/Light Split), Manage Callouts Settings Pane, Obsidian Settings Shell (sidebar: Options / Core plugins / Community plugins), currentCalloutEnvironment(), IconReinjector (+12 more)

### Community 4 - "Callout Resolver & Isolated Preview"
Cohesion: 0.09
Nodes (10): CalloutID, CalloutResolver, CalloutPreviewComponent, createLiveViewContainer(), createReadingViewContainer(), getCurrentStyles(), IsolatedCalloutPreviewComponent, IsolatedPreviewOptions (+2 more)

### Community 5 - "Main Plugin & Pane Navigation"
Cohesion: 0.10
Nodes (9): CalloutManagerAPIs, ChangelogSection, getSections(), CalloutManagerPlugin, ChangelogPane, UIPane, UIPane_FRIEND, UIPaneTitle (+1 more)

### Community 6 - "TypeScript Config & Test Refs"
Cohesion: 0.06
Nodes (31): dist/**/*, DOM, ES2017, ES2018, ES2019, ES5, ES6, ES7 (+23 more)

### Community 7 - "Package Manifest Metadata"
Cohesion: 0.07
Nodes (29): obsidian-extra, author, name, url, dependencies, obsidian-extra, description, keywords (+21 more)

### Community 8 - "Icon Registry Gotchas & Testability"
Cohesion: 0.08
Nodes (26): Babel preset-typescript fails to strip type args on new Map/Set() class-field initializers, callout-manager-lucide- icon prefix (not lucide-), CalloutPreviewComponent, CalloutResolver's hidden probe (needs unresolved empty icon), DEFAULT_ICON_ID ('lucide-pencil'), Neither test runner has a DOM (activeDocument, createDiv, createEl, instanceOf untestable), getIcon()/setIcon() fail to resolve addIcon()-registered entries under native lucide- prefix, icon-reinjection.ts's IconReinjector (+18 more)

### Community 9 - "Dev Reloader Utility"
Cohesion: 0.14
Nodes (8): FULL_RELOAD_FILES, obsidian, onload(), onunload(), overriddenStylesEl, PluginReloader, STYLE_RELOAD_FILES, watchPlugin()

### Community 10 - "Plugin API Events & Handles"
Cohesion: 0.15
Nodes (9): CalloutManagerEvent, CalloutManagerEventListener, CalloutManagerEventMap, CalloutManager, CalloutManagerOwnedHandle, CalloutManagerUnownedHandle, getApi(), isInstalled() (+1 more)

### Community 11 - "Plugin API Docs & Callout Types"
Cohesion: 0.13
Nodes (19): api/README.md — Callout Manager Plugin API, Callout type ({id, color, icon}), CalloutID type (string alias), CalloutManager<T> handle type, getApi(owner?: Plugin) function, getColor(callout) function, getTitle(callout) function, API Installation section (+11 more)

### Community 12 - "TSConfig Path Aliases"
Cohesion: 0.11
Nodes (19): ./api, ./api/callout, ./src/callout-resolver, ./src/callout-settings, ./src/callout-util, ./src/main, ./src/settings, ./src/ui/* (+11 more)

### Community 14 - "README Overview & Dev Commands"
Cohesion: 0.13
Nodes (15): README.md — Callout Manager (lhak fork), scripts/deploy.mjs, Obsidian plugin for browsing, customizing, and creating callouts, bun run build (typecheck + production bundle), bun run deploy (build + copy into configured vault), bun install, bun run test (jest, 33 tests), Feature: browse and search callouts (name/color/icon) (+7 more)

### Community 15 - "CLAUDE.md Architecture & Testing Notes"
Cohesion: 0.16
Nodes (14): getCallouts() function, CLAUDE.md — Callout Manager (lhak fork), API end-to-end test via newApiHandle('v1', ...), api/index.ts's getApi(), applyStyles closure inside onload (not extracted to method), CalloutManagerAPIs (src/apis.ts), CSS relative-color % unit inside calc() resolves wrong in this Chromium build, determineAppearanceType (src/callout-appearance.ts) (+6 more)

### Community 16 - "Insert Modal & Color Utils"
Cohesion: 0.26
Nodes (10): HSV, HSVA, parseColor(), parseColorHex(), parseColorRGB(), parseColorRGBA(), resolveColorToRgb(), RGB (+2 more)

### Community 17 - "Upstream Sync & Cherry-Picked Fixes"
Cohesion: 0.18
Nodes (12): Reviewed through bfdf696 (tag 1.1.2, 2026-08-07), Cherry-picked fix: --callout-color needs full rgb()/CSS color, callout-preview.ts, callout-settings.ts, callout-util.ts, changelog-pane.ts, changelog.ts, Cherry-picked fix: MarkdownRenderer.renderMarkdown -> .render(app, …) (+4 more)

### Community 18 - "Test Preload Mocks"
Cohesion: 0.20
Nodes (4): StubButton, StubComponent, StubSetting, StubTextInput

### Community 19 - "Callout Color Model Gotchas"
Cohesion: 0.22
Nodes (8): --callout-color CSS variable (not guaranteed R,G,B triplet), --callout-icon requires active setIcon() call, Per-callout color/icon overrides in data.json, Debug color/alias bugs by reading vault's data.json first, MutationObserver on document.body for post-insertion CSS var reads, registerMarkdownPostProcessor runs on detached elements (getComputedStyle vars empty), setIcon() must be timed to DOM insertion, Feature: alias groups (color/icon change propagates to aliases)

### Community 20 - "CalloutStore Seam & Repository"
Cohesion: 0.22
Nodes (9): CalloutManagerPlugin, CalloutRepository (src/callout-repository.ts), CalloutStore as architectural seam, CalloutRepository.createCustomCallout has no duplicate-id guard, main.ts's this.repository, Read-only consumers: InsertCalloutModal, apis.ts, api-v1.ts, renameCustomCallout (throws on duplicate), Internals restructured around a CalloutStore seam so panes don't depend on the plugin class (+1 more)

### Community 21 - "Manifest Fields (schema A)"
Cohesion: 0.22
Nodes (8): author, authorUrl, description, id, isDesktopOnly, minAppVersion, name, version

### Community 22 - "Manifest Fields (schema B)"
Cohesion: 0.22
Nodes (8): author, authorUrl, description, id, isDesktopOnly, minAppVersion, name, version

### Community 23 - "ADR-0003: Discovery Removal"
Cohesion: 0.29
Nodes (8): Commit acea84d: Overhaul manage pane with inline editing, Callout.sources / CalloutSource (removed from public API), CalloutCollection four-source model (removed), css-watcher.ts / css-parser.ts (deleted discovery mechanism), Decision: keep custom-only scope, Lesson: investigate call sites, not just code, before generalizing, isCustomOnly guard / non-custom rename guard (removed), obsidian-extra library (future discovery path)

### Community 24 - "Build Artifact Generation"
Cohesion: 0.33
Nodes (6): bun run build:plugin, bun run deploy, build/esbuild-plugin-obsidian/esbuild-plugin-obsidian.mjs, manifest.json (generated), package.json obsidianPlugin field, versions.json (generated)

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
Cohesion: 0.40
Nodes (4): Version 1.0.0, Version 1.0.1, Version 1.1.0, Version 1.1.1

### Community 31 - "CalloutStore Interface Composition"
Cohesion: 0.40
Nodes (5): ADR-0001 (Superseded) — pane stack/nav/suspend-restore removed, CalloutStore = CalloutReader + AliasStore + IconColorAdjustStore + CRUD, ChangelogPane, ManageCalloutsPane, UIPane (src/ui/pane.ts)

### Community 32 - "Deploy Script Targets"
Cohesion: 0.40
Nodes (3): OPTIONAL, REQUIRED, targets

### Community 33 - "Live Testing Vault Gotchas"
Cohesion: 0.67
Nodes (3): Find live .callout element via getLeavesOfType('markdown'), iconColorAdjust silently no-ops against wrong theme scheme, Feature: header color adjuster per light/dark mode

### Community 34 - "Fork Identity & Install Docs"
Cohesion: 0.67
Nodes (3): Fork of eth-p/obsidian-callout-manager, Install/dev docs must describe manual copy or BRAT, not upstream flow, Personal fork of eth-p/obsidian-callout-manager, diverged enough to be treated as separate plugin

## Ambiguous Edges - Review These
- `Per-Scheme Header Color Saturation/Lightness Adjuster` → `Callout List Row (abstract: aliases, color, icon)`  [AMBIGUOUS]
  docs/images/screenshot_manage_pane_darklight.png · relation: conceptually_related_to

## Knowledge Gaps
- **230 isolated node(s):** `ObsidianAppWithPlugins`, `extends`, `../tsconfig.json`, `*.ts`, `tsconfig` (+225 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **39 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Per-Scheme Header Color Saturation/Lightness Adjuster` and `Callout List Row (abstract: aliases, color, icon)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `CLAUDE.md — Callout Manager (lhak fork)` connect `CLAUDE.md Architecture & Testing Notes` to `Live Testing Vault Gotchas`, `Fork Identity & Install Docs`, `Icon Registry Gotchas & Testability`, `Plugin API Docs & Callout Types`, `README Overview & Dev Commands`, `Upstream Sync & Cherry-Picked Fixes`, `Callout Color Model Gotchas`, `CalloutStore Seam & Repository`, `Build Artifact Generation`, `CalloutStore Interface Composition`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `CalloutManagerPlugin` connect `Main Plugin & Pane Navigation` to `Settings & Stylesheet Assembly`, `Manage Callouts Pane UI`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `CalloutRepository` connect `Settings & Stylesheet Assembly` to `Plugin API v1`, `Main Plugin & Pane Navigation`, `Manage Callouts Pane UI`, `Callout Data Layer`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `ObsidianAppWithPlugins`, `extends`, `../tsconfig.json` to the rest of the system?**
  _230 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Plugin API v1` be split into smaller, more focused modules?**
  _Cohesion score 0.07932310946589106 - nodes in this community are weakly interconnected._
- **Should `Settings & Stylesheet Assembly` be split into smaller, more focused modules?**
  _Cohesion score 0.06382978723404255 - nodes in this community are weakly interconnected._