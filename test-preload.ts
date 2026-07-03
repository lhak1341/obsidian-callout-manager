import { mock } from 'bun:test';

// The obsidian package has no runtime JS (main: ""), so bun's native ESM loader
// fails when obsidian-extra tries to import { Platform } from 'obsidian' at the
// module level. Mock both packages before any test file can import them.

const noop = () => {};
const returnThis = function (this: unknown) { return this; };

class StubComponent {
	load = noop; unload = noop; addChild = noop; register = noop;
	registerEvent = noop; registerDomEvent = noop;
}

class StubSetting {
	setName = returnThis; setDesc = returnThis; addText = returnThis;
	addButton = returnThis; addDropdown = returnThis; addToggle = returnThis;
	addColorPicker = returnThis; addExtraButton = returnThis; setHeading = returnThis;
}

class StubButton {
	setIcon = returnThis; setTooltip = returnThis; onClick = returnThis;
	setDisabled = returnThis; setWarning = returnThis; setButtonText = returnThis;
	then = returnThis;
}

class StubTextInput {
	setValue = returnThis; setPlaceholder = returnThis; onChange = returnThis;
	getValue() { return ''; } then = returnThis;
	inputEl = { classList: { toggle: noop } };
}

mock.module('obsidian', () => ({
	Platform: { isDesktop: true, isMobile: false, isPhone: false, isMacOS: false, isWin: false, isLinux: false, isSafari: false },
	App: class {},
	Plugin: class {},
	PluginSettingTab: class {},
	Component: StubComponent,
	Events: class { on = noop; off = noop; trigger = noop; },
	Setting: StubSetting,
	ButtonComponent: StubButton,
	ExtraButtonComponent: StubButton,
	TextComponent: StubTextInput,
	TextAreaComponent: StubTextInput,
	DropdownComponent: class { addOption = returnThis; setValue = returnThis; onChange = returnThis; getValue() { return ''; } then = returnThis; },
	ColorComponent: class { setValue = returnThis; onChange = returnThis; getValue() { return '#000000'; } then = returnThis; },
	MarkdownRenderer: { renderMarkdown: async () => {} },
	getIcon: () => null,
	prepareFuzzySearch: (q: string) => (t: string) => t.includes(q) ? { score: 1, matches: [] } : null,
}));

mock.module('obsidian-extra', () => ({
	getCurrentColorScheme: () => 'light',
	getCurrentThemeID: () => null,
	getThemeManifest: () => null,
	getThemeStyleElement: () => null,
	openPluginSettings: noop,
	createCustomStyleSheet: () => {
		let _css = '';
		return Object.assign(noop, {
			get css() { return _css; },
			set css(v: string) { _css = v; },
			setAttribute: noop,
			removeAttribute: noop,
			is: () => false,
		});
	},
	getFloatingWindowRoots: () => [],
	getFloatingWindows: () => [],
	getRegisteredFileExtensions: () => [],
	getRegisteredViewTypes: () => [],
	getInstalledThemeIDs: () => [],
	getInstalledSnippetIDs: () => [],
	getEnabledSnippetIDs: () => [],
	getSnippetStyleElements: () => [],
	getSnippetStyleElement: () => null,
	isSnippetEnabled: () => false,
	isSnippetInstalled: () => false,
	getInstalledPluginIDs: () => [],
	getEnabledPluginIDs: () => [],
	getPluginInstance: () => null,
	getPluginManifest: () => null,
	isPluginEnabled: () => false,
	isPluginInstalled: () => false,
	fetchObsidianStyles: () => null,
	fetchObsidianStyleSheet: () => null,
	detectPlatformBrowser: () => null,
	detectPlatformRuntime: () => null,
	detectPlatformOperatingSystem: () => null,
}));
