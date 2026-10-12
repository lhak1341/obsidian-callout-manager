import type { App, Plugin } from 'obsidian';
import { CustomStyleSheet, createCustomStyleSheet } from 'obsidian-extra';

import type { CalloutID } from '&callout';

import { CalloutResolver } from './callout-resolver';
import type { StyleHost } from './callout-repository';

/** `data-callout-manager` value marking the plugin's own override `<style>` element. */
const STYLE_OVERRIDES_ID = 'style-overrides';

/**
 * The production {@link StyleHost}: the plugin's override `<style>` tag in the document plus the
 * shadow-DOM {@link CalloutResolver} that reads the resolved icon and color back out. Owns both
 * and registers their cleanup on the plugin.
 *
 * The resolver copies the document's stylesheets on `reloadStyles()`, including our own override
 * tag, so it strips that copy and relies on `setCss()` to seed the up-to-date overrides instead.
 */
export class ObsidianStyleHost implements StyleHost {
	private readonly resolver: CalloutResolver;
	private readonly sheet: CustomStyleSheet;

	public constructor(app: App, plugin: Plugin) {
		// The resolver needs to exist as early as possible so the Obsidian stylesheet within its
		// shadow DOM has loaded.
		this.resolver = new CalloutResolver(
			app,
			(el) => el.getAttribute('data-callout-manager') === STYLE_OVERRIDES_ID,
		);
		plugin.register(() => this.resolver.unload());

		this.sheet = createCustomStyleSheet(app, plugin);
		this.sheet.setAttribute('data-callout-manager', STYLE_OVERRIDES_ID);
		plugin.register(this.sheet);
	}

	public getCalloutProperties(id: CalloutID): { icon: string; color: string } {
		return this.resolver.getCalloutProperties(id);
	}

	public reloadStyles(): void {
		this.resolver.reloadStyles();
	}

	public setCss(css: string): void {
		this.sheet.css = css;
		this.resolver.setCustomStyles(css);
	}
}
