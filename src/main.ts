import { MarkdownView, Notice, Plugin, debounce } from 'obsidian';

import { UISettingTab } from '&ui/paned-setting-tab';

import type { CalloutManager } from '../api';

import { CalloutManagerAPIs } from './apis';
import { CalloutRepository } from './callout-repository';
import { currentCalloutEnvironment } from './callout-settings';
import { registerEditorFeatures } from './editor-features';
import { IconReinjector } from './icon-reinjection';
import { registerLucideIcons } from './lucide-icons';
import { InsertCalloutModal } from './panes/insert-callout-modal';
import { ObsidianStyleHost } from './obsidian-style-host';
import { ManageCalloutsPane } from './panes/manage-callouts-pane';
import { SaveReporter } from './save-reporter';
import { auxiliaryFiles, resolveStartup } from './startup-settings';


export default class CalloutManagerPlugin extends Plugin {
	public repository!: CalloutRepository;

	private readonly api = new CalloutManagerAPIs();

	private readonly saveReporter = new SaveReporter(
		(message) => new Notice(message),
		(error) => console.error('Callout Manager: saving settings failed', error),
	);

	public settingTab!: UISettingTab;

	/** @override */
	public async onload() {
		const settings = await this.loadSettings();

		// Register the full offline Lucide icon set (gap-filled against whatever
		// subset this Obsidian version bundles natively) before anything renders.
		registerLucideIcons();

		// The style host needs to be created as early as possible so the Obsidian stylesheet within
		// its shadow DOM has loaded. The repository's environment-change events keep it in sync.
		this.repository = new CalloutRepository(this.app, settings, {
			style: new ObsidianStyleHost(this.app, this),
			environment: () => currentCalloutEnvironment(this.app),
			save: (data) => this.saveReporter.run(() => this.saveData(data)),
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

		registerEditorFeatures({ plugin: this, store: this.repository, settingTab: this.settingTab });

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
	 * Reads `data.json` and decides what to start with (see `resolveStartup`). Never rewrites a file
	 * it could not read: a missing file falls back to the last known-good copy, and a file that
	 * lost invalid entries is kept whole in `data.quarantine.json` before anything is saved.
	 */
	private async loadSettings() {
		const dir = this.manifest.dir;
		const adapter = this.app.vault.adapter;
		const backupPath = dir ? `${dir}/data.backup.json` : null;
		const quarantinePath = dir ? `${dir}/data.quarantine.json` : null;

		const raw: unknown = await this.loadData();
		const backupText = backupPath && (await adapter.exists(backupPath)) ? await adapter.read(backupPath) : null;

		let backup: unknown = null;
		try {
			backup = backupText === null ? null : JSON.parse(backupText);
		} catch {
			// An unreadable backup is no backup.
		}

		const startup = resolveStartup(raw, backup);

		// The side files are a safety net; failing to write one must not stop the plugin loading.
		try {
			const files = auxiliaryFiles(startup, raw, backupText);
			if (files.quarantine !== undefined && quarantinePath) await adapter.write(quarantinePath, files.quarantine);
			if (files.backup !== undefined && backupPath) await adapter.write(backupPath, files.backup);
		} catch (error) {
			console.error('Callout Manager: writing a settings backup failed', error);
		}

		if (startup.source === 'backup') {
			new Notice('The settings file was missing; restored the last known-good copy.');
		}
		if (startup.dropped.length > 0) {
			new Notice(
				`Callout Manager: ${startup.dropped.length} invalid settings entries were dropped. The original is in data.quarantine.json.`,
			);
		}

		if (startup.save) this.saveReporter.run(() => this.saveData(startup.settings));
		return startup.settings;
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
