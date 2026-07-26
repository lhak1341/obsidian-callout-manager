import { PluginSettingTab, ButtonComponent } from 'obsidian';
import { openPluginSettings } from 'obsidian-extra';
import { closeSettings } from 'obsidian-extra/unsafe';

import CalloutManagerPlugin from '&plugin';

import { UIPane, UIPane_FRIEND } from './pane';

/**
 * The settings tab (UI) that will show up under Obsidian's settings.
 *
 * Hosts a single {@link UIPane} at a time.
 */
export class UISettingTab extends PluginSettingTab {
	private readonly plugin: CalloutManagerPlugin;
	private readonly createDefault: () => UIPane;

	private initLayer: UIPane | null;
	private activePane: UIPane_FRIEND | undefined;

	private titleEl!: HTMLElement;
	private navEl!: HTMLElement;
	private controlsEl!: HTMLElement;
	private scrollEl!: HTMLElement;
	private paneContainerEl!: HTMLElement;

	public constructor(plugin: CalloutManagerPlugin, createDefault: () => UIPane) {
		super(plugin.app, plugin);
		this.plugin = plugin;
		this.createDefault = createDefault;
		this.initLayer = null;
	}

	public openWithPane(pane: UIPane) {
		this.initLayer = pane;
		openPluginSettings(this.plugin.app, this.plugin);
	}

	/** @override */
	public hide(): void {
		this.initLayer = null;
		this.closeActivePane();
		super.hide();
	}

	public display(): void {
		const { containerEl } = this;

		// Clear the container and create the elements.
		containerEl.empty();
		containerEl.classList.add('calloutmanager-setting-tab', 'calloutmanager-pane');

		const headerEl = containerEl.createDiv({ cls: 'calloutmanager-setting-tab-header' });
		this.navEl = headerEl.createDiv({ cls: 'calloutmanager-setting-tab-nav' });
		this.titleEl = headerEl.createDiv({ cls: 'calloutmanager-setting-tab-title' });

		const headerControlsEl = headerEl.createDiv({ cls: 'calloutmanager-setting-tab-controls' });
		this.controlsEl = headerControlsEl.createDiv();
		this.scrollEl = containerEl.createDiv({
			cls: 'calloutmanager-setting-tab-viewport vertical-tab-content',
		});
		this.paneContainerEl = this.scrollEl.createDiv({ cls: 'calloutmanager-setting-tab-content' });

		// Create a close button, since the native one is covered.
		const closeBtn = new ButtonComponent(headerControlsEl);
		closeBtn.setIcon('lucide-x');
		closeBtn.buttonEl.classList.add('modal-close-button');
		closeBtn.buttonEl.classList.add('mod-raised');
		closeBtn.buttonEl.classList.add('clickable-icon');
		closeBtn.onClick((ev) => {
			if (!ev.isTrusted) return;
			closeSettings(this.app);
		});

		// Close any previous pane, then render the pane (or the default).
		this.closeActivePane();
		const pane = this.initLayer ?? this.createDefault();
		this.initLayer = null;
		this.setActivePane(pane);
	}

	private setActivePane(pane: UIPane): void {
		const newPane = (this.activePane = pane as unknown as UIPane_FRIEND);
		this.setPaneVariables(newPane, true);
		newPane.onReady();
		this.renderActivePane();
		this.scrollEl.scrollTo({ top: 0, left: 0 });
	}

	private closeActivePane(cancelled = false): void {
		const { activePane } = this;
		if (activePane === undefined) {
			return;
		}

		this.activePane = undefined;
		this.setPaneVariables(activePane, false);
		activePane.onClose(cancelled);
	}

	private renderActivePane(): void {
		const { activePane, titleEl, controlsEl, paneContainerEl } = this;
		if (activePane === undefined) {
			return;
		}

		titleEl.empty();

		controlsEl.empty();
		activePane.displayControls();

		const hasControls = controlsEl.childElementCount > 0;
		this.navEl.parentElement?.classList.toggle('calloutmanager-setting-tab-header--active', hasControls);

		paneContainerEl.empty();
		activePane.display();
	}

	private setPaneVariables(pane: UIPane_FRIEND, attached: boolean) {
		const notAttachedError = () => {
			throw new Error('Not attached');
		};

		Object.defineProperties<UIPane_FRIEND>(pane, {
			containerEl: {
				configurable: true,
				enumerable: true,
				get: attached ? () => this.paneContainerEl : notAttachedError,
			},

			controlsEl: {
				configurable: true,
				enumerable: true,
				get: attached ? () => this.controlsEl : notAttachedError,
			},
		});
	}
}

// ---------------------------------------------------------------------------------------------------------------------
// Styles:
// ---------------------------------------------------------------------------------------------------------------------

declare const STYLES: `
	// The setting tab container.
	.mod-sidebar-layout .calloutmanager-setting-tab.vertical-tab-content {
		position: relative;
		padding: 0 !important;
		display: flex;
		flex-direction: column;

		// Prevent scrolling on the parent container so we can have a sticky header.
		overflow-y: initial;

		// Variables.
		& {
			// Set a margin that allows the controls to become padding if there's nothing inside them.
			--cm-setting-tab-controls-margin: calc(var(--size-4-12) - (var(--size-4-2) - var(--size-4-1)));
			body.is-phone & {
				--cm-setting-tab-controls-margin: var(--size-4-2);
			}
		}
	}

	// The setting tab header — hidden at root, shown when the pane renders controls.
	.calloutmanager-setting-tab-header {
		display: none;
		align-items: center;

		// Padding to mimic the sizing of the '.vertical-tab-content'
		padding-top: var(--size-4-1);
		padding-bottom: var(--size-4-1);
		padding-right: var(--size-4-2);

		// Bottom border to separate the header from the content.
		border-bottom: 1px solid var(--background-modifier-border);

		// Use the background of the sidebar.
		background-color: var(--background-secondary);

		body.is-phone & {
			background-color: var(--background-primary);
			margin-top: var(--modal-header-height);
		}

		&.calloutmanager-setting-tab-header--active {
			display: flex;
		}
	}

	// The setting tab nav within the header.
	.calloutmanager-setting-tab-nav {
		display: flex;
		align-items: center;
		justify-content: center;

		// Ensure the nav is at least as big as a button.
		min-width: var(--size-4-12);
		min-height: calc(var(--size-4-2) + var(--input-height));

		// Override the button padding.
		button {
			padding: var(--size-4-1) var(--size-4-2);
			box-shadow: none;
		}

		// Reduce padding for mobile.
		body.is-mobile & {
			padding: var(--size-4-2);
		}

		body.is-phone &,
		body.is-phone & button {
			height: 100%;
			min-width: unset;
		}
	}

	// The setting tab nav within the header.
	.calloutmanager-setting-tab-controls {
		flex: 3 3;

		display: flex;
		align-items: center;
		justify-content: end;
		gap: var(--size-4-2);

		padding-left: var(--cm-setting-tab-controls-margin);

		// Make the real control elements transparent to the container.
		> *:not(.modal-close-button) {
			display: contents;

			> input[type='text'] {
				flex: 1 1 auto;
			}
		}
	}

	.calloutmanager-setting-tab-controls .modal-close-button {
		flex: 0 0 auto;

		position: static;
		left: unset;
		top: 0;
		right: 0;
		bottom: 0;

		body.is-phone & {
			display: none;
		}
	}

	// The setting tab title within the header.
	.calloutmanager-setting-tab-title {
		flex: 1 1 auto;
		flex-wrap: nowrap;

		&:empty {
			display: none;
		}

		h2,
		h3 {
			margin: 0;
			word-break: keep-all;
		}

		h3 {
			font-size: var(--font-ui-small);
		}

		body:not(.is-phone) & h3 {
			font-size: 0.8em;
		}

		body.is-phone & h2:has(+ h3) {
			display: none;
		}
	}

	// The scroll container for the setting tab.
	.calloutmanager-setting-tab-viewport {
		flex: 1 2 auto;

		body.is-phone & {
			--modal-header-height: var(--size-2-1);
		}

		// Enable scrolling.
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
	}

	.calloutmanager-setting-tab-content {
		flex: 1 1 auto;

		body:not(.is-phone) {
			min-height: 100%;
		}
	}
`;
