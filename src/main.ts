import { Plugin } from 'obsidian';
import { CustomStyleSheet, createCustomStyleSheet } from 'obsidian-extra';

import { UISettingTab } from '&ui/paned-setting-tab';

import type { Callout, CalloutID, CalloutManager } from '../api';

import { CalloutManagerAPIs } from './apis';
import { CalloutCollection } from './callout-collection';
import { CalloutResolver } from './callout-resolver';
import { CalloutSettings, currentCalloutEnvironment } from './callout-settings';
import { assembleStylesheet } from './assemble-stylesheet';
import { InsertCalloutModal } from './panes/insert-callout-modal';
import { ManageCalloutsPane } from './panes/manage-callouts-pane';
import { ManagePluginPane } from './panes/manage-plugin-pane';
import { CalloutStore } from './callout-store';
import Settings, { defaultSettings, migrateSettings } from './settings';


export default class CalloutManagerPlugin extends Plugin implements CalloutStore {
	public settings!: Settings;
	public cssApplier!: CustomStyleSheet;

	public calloutResolver!: CalloutResolver;
	public callouts!: CalloutCollection;

	public api!: CalloutManagerAPIs;
	private apiReadySignal!: () => void;
	private apiReadyWait = new Promise((resolve, reject) => (this.apiReadySignal = resolve as () => void));

	public settingTab!: UISettingTab;

	/** @override */
	public async onload() {
		await this.loadSettings();
		await this.saveSettings();
		const { settings } = this;

		// Create the callout resolver.
		// This needs to be created as early as possible to ensure the Obsidian stylesheet within the shadow DOM has loaded.
		// We also register an event to ensure that it tracks any changes to the loaded styles.
		this.calloutResolver = new CalloutResolver(this.app);
		this.register(() => this.calloutResolver.unload());

		// Create the callout collection.
		// Use getCalloutProperties to resolve the callout's color and icon.
		this.callouts = new CalloutCollection((id) => {
			const { icon, color } = this.calloutResolver.getCalloutProperties(id);
			return {
				id,
				icon,
				color,
			};
		});

		// Add the custom callouts.
		this.callouts.custom.add(...settings.callouts.custom);

		// Create a plugin-managed style sheet.
		//  -> This is used to apply the user's custom styles to callouts.
		this.cssApplier = createCustomStyleSheet(this.app, this);
		this.cssApplier.setAttribute('data-callout-manager', 'style-overrides');
		this.register(this.cssApplier);
		this.applyStyles();

		// Register a listener for whenever the CSS changes or layout changes (e.g. floating windows open).
		//   Since the styles for a callout can change, we need to reload the styles in the resolver.
		//   It's also a good idea to reapply our own styles, since the color scheme or theme could have changed.
		//   Debounced to avoid redundant reapply calls when multiple events fire in quick succession.
		let reapplyTimer = 0;
		const reapplyDebounced = () => {
			window.clearTimeout(reapplyTimer);
			reapplyTimer = window.setTimeout(() => {
				this.calloutResolver.reloadStyles();
				this.applyStyles();
			}, 50);
		};
		this.registerEvent(this.app.workspace.on('css-change', reapplyDebounced));
		this.registerEvent(this.app.workspace.on('layout-change', reapplyDebounced));

		// Register setting tab.
		this.settingTab = new UISettingTab(this, () => new ManagePluginPane(this));
		this.addSettingTab(this.settingTab);

		// Register modal commands.
		this.addCommand({
			id: 'manage-callouts',
			name: 'Edit callouts',
			callback: () => {
				this.settingTab.openWithPane(new ManageCalloutsPane(this));
			},
		});

		this.addCommand({
			id: 'insert-callout',
			name: 'Insert callout',
			editorCallback: () => {
				new InsertCalloutModal(this).open();
			},
		});

		// Signal to wake async functions waiting for the API to be ready.
		this.api = new CalloutManagerAPIs(this);
		this.apiReadySignal();

		// Defer UI elements that don't need to be ready before the workspace loads.
		this.app.workspace.onLayoutReady(() => {
			this.addRibbonIcon('lucide-gallery-vertical', 'Insert callout', () => {
				new InsertCalloutModal(this).open();
			});
		});
	}

	async loadSettings() {
		this.settings = migrateSettings(defaultSettings(), await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private saveCustomCallouts(): Promise<void> {
		const { callouts, settings } = this;
		settings.callouts.custom = callouts.custom.keys();
		return this.saveSettings();
	}

	/**
	 * Create a custom callout and add it to Obsidian.
	 * @param id The custom callout ID.
	 */
	public createCustomCallout(id: CalloutID): void {
		const { callouts } = this;
		callouts.custom.add(id);
		this.saveCustomCallouts();
		this.api.emitEventForCalloutChange(id);
	}

	/**
	 * Rename a custom callout.
	 *
	 * @param oldId The old callout ID.
	 * @param newId The new callout ID.
	 * @throws If the callout has any other sources than "custom".
	 * @throws If the old ID does not exist.
	 * @throws If the new ID already exists.
	 */
	public renameCustomCallout(oldId: CalloutID, newId: CalloutID): void {
		const { callouts, settings } = this;

		const callout = callouts.get(oldId);
		if (callout == null) throw new Error(`Callout '${oldId}' does not exist.`);
		if (callouts.get(newId) != null) throw new Error(`Callout '${newId}' already exists.`);
		if (callout.sources.length !== 1 || callout.sources[0].type !== 'custom') {
			throw new Error(`Cannot rename non-custom callout '${oldId}'.`);
		}

		// Move the settings over to the new ID.
		callouts.custom.delete(oldId);
		callouts.custom.add(newId);
		settings.callouts.custom = callouts.custom.keys();
		settings.callouts.settings[newId] = settings.callouts.settings[oldId];
		delete settings.callouts.settings[oldId];

		// Save the settings and emit events.
		this.applyStyles();
		this.saveCustomCallouts();
		this.api.emitEventForCalloutChange(oldId);
		this.api.emitEventForCalloutChange(newId);
	}

	/**
	 * Delete a custom callout.
	 * If there are no other sources for the callout, its settings will be purged.
	 *
	 * @param id The custom callout ID.
	 */
	public removeCustomCallout(id: CalloutID): void {
		const { callouts, settings } = this;
		callouts.custom.delete(id);
		settings.callouts.custom = callouts.custom.keys();

		// Remove the callout settings (if there are no other sources for it).
		const calloutInstance = callouts.get(id);
		if (calloutInstance == null || calloutInstance.sources.length < 1) {
			delete settings.callouts.settings[id];
			this.applyStyles();
		}

		// Save settings and emit an API event.
		this.saveSettings();
		this.api.emitEventForCalloutChange(id);
	}

	public getCallouts(): Callout[] {
		return this.callouts.values();
	}

	public getCallout(id: CalloutID): Callout | undefined {
		return this.callouts.get(id);
	}

	public hasCallout(id: CalloutID): boolean {
		return this.callouts.has(id);
	}

	public getAliasGroups(): Record<string, string[]> {
		return { ...this.settings.aliasGroups };
	}

	public setAliasGroup(canonical: string, aliases: string[]): void {
		if (aliases.length === 0) {
			delete this.settings.aliasGroups[canonical];
		} else {
			this.settings.aliasGroups[canonical] = aliases;
		}
		this.saveSettings();
		this.applyStyles();
	}

	/**
	 * Gets the custom settings for a callout.
	 *
	 * @param id The callout ID.
	 * @returns The custom settings, or undefined if there are none.
	 */
	public getCalloutSettings(id: CalloutID): CalloutSettings | undefined {
		const calloutSettings = this.settings.callouts.settings;
		if (!Object.prototype.hasOwnProperty.call(calloutSettings, id)) {
			return undefined;
		}

		return calloutSettings[id];
	}

	/**
	 * Sets the custom settings for a callout.
	 *
	 * @param id The callout ID.
	 * @param settings The callout settings.
	 */
	public setCalloutSettings(id: CalloutID, settings: CalloutSettings | undefined) {
		const calloutSettings = this.settings.callouts.settings;

		// Update settings.
		if (settings === undefined || settings.length < 1) {
			delete calloutSettings[id];
		} else {
			calloutSettings[id] = settings;
		}

		// Save.
		this.saveSettings();

		// Reapply.
		this.applyStyles();
		this.callouts.invalidate(id);

		// Emit.
		this.api.emitEventForCalloutChange(id);
	}

	/**
	 * Generates the stylesheet for the user's custom callout settings and applies it to the page and the callout
	 * resolver's custom stylesheet.
	 */
	public applyStyles() {
		const css = assembleStylesheet(
			this.settings.callouts.settings,
			this.settings.aliasGroups,
			currentCalloutEnvironment(this.app),
			this.calloutResolver,
		);
		this.cssApplier.css = css;
		this.calloutResolver.setCustomStyles(css);
	}

	/**
	 * Creates (or gets) an instance of the Callout Manager API for a plugin.
	 * If the plugin is undefined, only trivial functions are available.
	 *
	 * @param version The API version.
	 * @param consumerPlugin The plugin using the API.
	 *
	 * @internal
	 */
	public async newApiHandle(
		version: 'v1',
		consumerPlugin: Plugin | undefined,
		cleanupFunc: () => void,
	): Promise<CalloutManager> {
		await this.apiReadyWait;
		return this.api.newHandle(version, consumerPlugin, cleanupFunc);
	}

	/**
	 * Destroys an API handle created by {@link newApiHandle}.
	 *
	 * @param version The API version.
	 * @param consumerPlugin The plugin using the API.
	 *
	 * @internal
	 */
	public destroyApiHandle(version: 'v1', consumerPlugin: Plugin) {
		if (version !== 'v1') throw new Error(`Unsupported Callout Manager API: ${version}`);
		return this.api.destroyHandle(version, consumerPlugin);
	}
}
