import { MarkdownView, Plugin, debounce } from 'obsidian';

import { UISettingTab } from '&ui/paned-setting-tab';

import type { CalloutManager } from '../api';

import { CalloutManagerAPIs } from './apis';
import { CalloutRepository } from './callout-repository';
import { currentCalloutEnvironment } from './callout-settings';
import { IconReinjector } from './icon-reinjection';
import { registerLucideIcons } from './lucide-icons';
import { InsertCalloutModal } from './panes/insert-callout-modal';
import { ObsidianStyleHost } from './obsidian-style-host';
import { ManageCalloutsPane } from './panes/manage-callouts-pane';
import Settings, { defaultSettings, migrateSettings } from './settings';


export default class CalloutManagerPlugin extends Plugin {
	public repository!: CalloutRepository;

	private readonly api = new CalloutManagerAPIs();

	public settingTab!: UISettingTab;

	/** @override */
	public async onload() {
		const settings: Settings = migrateSettings(defaultSettings(), await this.loadData());
		await this.saveData(settings);

		// Register the full offline Lucide icon set (gap-filled against whatever
		// subset this Obsidian version bundles natively) before anything renders.
		registerLucideIcons();

		// The style host needs to be created as early as possible so the Obsidian stylesheet within
		// its shadow DOM has loaded. The repository's environment-change events keep it in sync.
		this.repository = new CalloutRepository(this.app, settings, {
			style: new ObsidianStyleHost(this.app, this),
			environment: () => currentCalloutEnvironment(this.app),
			save: (data) => this.saveData(data),
		});

		// Register a listener for whenever the CSS changes or layout changes (e.g. floating windows open).
		//   Since the styles for a callout can change, we need to reload the styles in the resolver.
		//   It's also a good idea to reapply our own styles, since the color scheme or theme could have changed.
		//   Debounced to avoid redundant reapply calls when multiple events fire in quick succession.
		const reapplyDebounced = debounce(
			() => this.repository.environmentChanged(),
			50,
			true,
		);
		this.register(() => reapplyDebounced.cancel());
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
			editorCallback: (editor) => {
				new InsertCalloutModal(this.repository, editor).open();
			},
		});

		// Wake async functions waiting for the API to be ready.
		this.api.attach(this.repository);

		// Defer UI elements that don't need to be ready before the workspace loads.
		this.app.workspace.onLayoutReady(() => {
			this.addRibbonIcon('lucide-gallery-vertical', 'Insert callout', () => {
				const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor ?? null;
				new InsertCalloutModal(this.repository, editor).open();
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
