import { Plugin } from 'obsidian';
import { CustomStyleSheet, createCustomStyleSheet } from 'obsidian-extra';

import { UISettingTab } from '&ui/paned-setting-tab';

import type { CalloutManager } from '../api';

import { CalloutManagerAPIs } from './apis';
import { CalloutRepository } from './callout-repository';
import { CalloutResolver } from './callout-resolver';
import { currentCalloutEnvironment } from './callout-settings';
import { assembleStylesheet } from './assemble-stylesheet';
import { IconReinjector } from './icon-reinjection';
import { registerLucideIcons } from './lucide-icons';
import { InsertCalloutModal } from './panes/insert-callout-modal';
import { ManageCalloutsPane } from './panes/manage-callouts-pane';
import Settings, { defaultSettings, migrateSettings } from './settings';


export default class CalloutManagerPlugin extends Plugin {
	public repository!: CalloutRepository;

	private calloutResolver!: CalloutResolver;
	private cssApplier!: CustomStyleSheet;
	private api!: CalloutManagerAPIs;
	private apiReadySignal!: () => void;
	private apiReadyWait = new Promise((resolve, reject) => (this.apiReadySignal = resolve as () => void));

	public settingTab!: UISettingTab;

	/** @override */
	public async onload() {
		const settings: Settings = migrateSettings(defaultSettings(), await this.loadData());
		await this.saveData(settings);

		// Register the full offline Lucide icon set (gap-filled against whatever
		// subset this Obsidian version bundles natively) before anything renders.
		registerLucideIcons();

		// Create the callout resolver.
		// This needs to be created as early as possible to ensure the Obsidian stylesheet within the shadow DOM has loaded.
		// We also register an event to ensure that it tracks any changes to the loaded styles.
		this.calloutResolver = new CalloutResolver(this.app);
		this.register(() => this.calloutResolver.unload());

		// Create a plugin-managed style sheet.
		//  -> This is used to apply the user's custom styles to callouts.
		this.cssApplier = createCustomStyleSheet(this.app, this);
		this.cssApplier.setAttribute('data-callout-manager', 'style-overrides');
		this.register(this.cssApplier);

		const applyStyles = () => {
			const css = assembleStylesheet(
				settings.callouts.settings,
				settings.aliasGroups,
				currentCalloutEnvironment(this.app),
				settings.iconColorAdjust,
			);
			this.cssApplier.css = css;
			this.calloutResolver.setCustomStyles(css);
		};

		// Create the callout repository.
		this.repository = new CalloutRepository(
			this.app,
			settings,
			(id) => this.calloutResolver.getCalloutProperties(id),
			(data) => { applyStyles(); this.saveData(data); },
			(id) => this.api.emitEventForCalloutChange(id),
		);

		applyStyles();

		// Register a listener for whenever the CSS changes or layout changes (e.g. floating windows open).
		//   Since the styles for a callout can change, we need to reload the styles in the resolver.
		//   It's also a good idea to reapply our own styles, since the color scheme or theme could have changed.
		//   Debounced to avoid redundant reapply calls when multiple events fire in quick succession.
		let reapplyTimer = 0;
		const reapplyDebounced = () => {
			window.clearTimeout(reapplyTimer);
			reapplyTimer = window.setTimeout(() => {
				this.calloutResolver.reloadStyles();
				applyStyles();
			}, 50);
		};
		this.registerEvent(this.app.workspace.on('css-change', reapplyDebounced));
		this.registerEvent(this.app.workspace.on('layout-change', reapplyDebounced));

		// Re-inject icons for callouts where Obsidian skipped icon injection (see IconReinjector).
		const iconReinjector = new IconReinjector();
		this.register(() => iconReinjector.unload());
		this.registerEvent(this.app.workspace.on('window-open', (_, win) => iconReinjector.attach(win)));
		this.registerEvent(this.app.workspace.on('window-close', (_, win) => iconReinjector.detach(win)));

		// Register setting tab.
		this.settingTab = new UISettingTab(this, () => new ManageCalloutsPane(this.repository));
		this.addSettingTab(this.settingTab);

		// Register modal commands.
		this.addCommand({
			id: 'manage-callouts',
			name: 'Edit callouts',
			callback: () => {
				this.settingTab.openWithPane(new ManageCalloutsPane(this.repository));
			},
		});

		this.addCommand({
			id: 'insert-callout',
			name: 'Insert callout',
			editorCallback: () => {
				new InsertCalloutModal(this.repository).open();
			},
		});

		// Signal to wake async functions waiting for the API to be ready.
		this.api = new CalloutManagerAPIs(this.repository);
		this.apiReadySignal();

		// Defer UI elements that don't need to be ready before the workspace loads.
		this.app.workspace.onLayoutReady(() => {
			this.addRibbonIcon('lucide-gallery-vertical', 'Insert callout', () => {
				new InsertCalloutModal(this.repository).open();
			});
		});
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
		return this.api.destroyHandle(version, consumerPlugin);
	}
}
