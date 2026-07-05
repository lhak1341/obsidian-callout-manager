import type { App } from 'obsidian';

export type CustomStyleSheet = {
	(): void;
	get css(): string;
	set css(text: string);
	setAttribute(attr: string, value: string): void;
	removeAttribute(attr: string): void;
	is(el: HTMLElement): boolean;
};

function makeCustomStyleSheet(): CustomStyleSheet {
	let _css = '';
	const fn = function () {} as unknown as CustomStyleSheet;
	Object.defineProperties(fn, {
		css: { get: () => _css, set: (v: string) => { _css = v; } },
		setAttribute: { value: () => {} },
		removeAttribute: { value: () => {} },
		is: { value: () => false },
	});
	return fn;
}

export function getCurrentColorScheme(_app: App): 'dark' | 'light' { return 'light'; }
export function getCurrentThemeID(_app: App): string | null { return null; }
export function getThemeManifest(_app: App, _id: string): unknown { return null; }
export function getThemeStyleElement(_app: App, _id: string): HTMLStyleElement | null { return null; }
export function openPluginSettings(_app: App, _pluginId: string): void {}
export function createCustomStyleSheet(_app: App, _plugin: unknown): CustomStyleSheet { return makeCustomStyleSheet(); }
export function getFloatingWindowRoots(_app: App): unknown[] { return []; }
export function getFloatingWindows(_app: App): unknown[] { return []; }
export function getRegisteredFileExtensions(_app: App): string[] { return []; }
export function getRegisteredViewTypes(_app: App): string[] { return []; }
export function getInstalledThemeIDs(_app: App): string[] { return []; }
export function getInstalledSnippetIDs(_app: App): string[] { return []; }
export function getEnabledSnippetIDs(_app: App): string[] { return []; }
export function getSnippetStyleElements(_app: App): HTMLStyleElement[] { return []; }
export function getSnippetStyleElement(_app: App, _id: string): HTMLStyleElement | null { return null; }
export function isSnippetEnabled(_app: App, _id: string): boolean { return false; }
export function isSnippetInstalled(_app: App, _id: string): boolean { return false; }
export function getInstalledPluginIDs(_app: App): string[] { return []; }
export function getEnabledPluginIDs(_app: App): string[] { return []; }
export function getPluginInstance(_app: App, _id: string): unknown { return null; }
export function getPluginManifest(_app: App, _id: string): unknown { return null; }
export function isPluginEnabled(_app: App, _id: string): boolean { return false; }
export function isPluginInstalled(_app: App, _id: string): boolean { return false; }
export function fetchObsidianStyles(_app: App): unknown { return null; }
export function fetchObsidianStyleSheet(_app: App): unknown { return null; }
export function detectPlatformBrowser(): unknown { return null; }
export function detectPlatformRuntime(): unknown { return null; }
export function detectPlatformOperatingSystem(): unknown { return null; }
