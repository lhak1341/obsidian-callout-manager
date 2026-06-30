import { ButtonComponent, Setting } from 'obsidian';

import CalloutManagerPlugin from '&plugin';

import { UIPane } from '&ui/pane';

import { getSections } from '../changelog';

import { ChangelogPane } from './changelog-pane';
import { ManageCalloutsPane } from './manage-callouts-pane';

export class ManagePluginPane extends UIPane {
	public readonly title = 'Callout Manager Settings';
	private plugin: CalloutManagerPlugin;

	public constructor(plugin: CalloutManagerPlugin) {
		super();
		this.plugin = plugin;
	}

	/** @override */
	public display(): void {
		const { containerEl, plugin } = this;

		// -----------------------------------------------------------------------------------------------------
		// Navigation.
		// -----------------------------------------------------------------------------------------------------
		new Setting(containerEl)
			.setName('Manage callouts')
			.setDesc('Create or edit Markdown callouts.')
			.addButton((btn) => {
				btn.setButtonText('Manage callouts');
				btn.onClick(() => this.nav.open(new ManageCalloutsPane(plugin)));
			});

		// -----------------------------------------------------------------------------------------------------
		// Section: Changelog
		// -----------------------------------------------------------------------------------------------------
		new Setting(containerEl)
			.setHeading()
			.setName("What's new")
			.setDesc(`Version ${this.plugin.manifest.version}`)
			.addExtraButton((btn) => {
				btn.setIcon('lucide-more-horizontal')
					.setTooltip('More changelogs')
					.onClick(() => this.nav.open(new ChangelogPane(plugin)));
			});

		const latestChanges = getSections(this.root).get(this.plugin.manifest.version);
		if (latestChanges != null) {
			const desc = activeDocument.createDocumentFragment();
			desc.appendChild(latestChanges.contentsEl);

			new Setting(containerEl)
				.setDesc(desc)
				.then((setting) => setting.controlEl.remove())
				.then((setting) => setting.settingEl.classList.add('calloutmanager-latest-changes'));
		}

		// -----------------------------------------------------------------------------------------------------
		// Section: Export
		// -----------------------------------------------------------------------------------------------------
		new Setting(containerEl).setHeading().setName('Export');

		new Setting(containerEl)
			.setName('Callout styles')
			.setDesc('Export your custom callouts and changes as CSS.')
			.addButton((btn) => {
				btn.setButtonText('Copy');
				btn.onClick(async () => {
					btn.setDisabled(true);

					try {
						await navigator.clipboard.writeText('/* Exported Styles from Obsidian Callout Manager */\n' + this.plugin.cssApplier.css)
						btn.setButtonText("Copied!");
					} catch {
						btn.setButtonText("Error");
					}
				});
			});

		// -----------------------------------------------------------------------------------------------------
		// Section: Reset
		// -----------------------------------------------------------------------------------------------------
		new Setting(containerEl).setHeading().setName('Reset');

		new Setting(containerEl)
			.setName('Reset callout settings')
			.setDesc('Reset all the changes you made to callouts.')
			.addButton(
				withConfirm((btn) => {
					btn.setButtonText('Reset').onClick(() => {
						this.plugin.settings.callouts.settings = {};
						this.plugin.saveSettings();

						// Regenerate the callout styles.
						this.plugin.applyStyles();
						btn.setButtonText('Reset').setDisabled(true);
					});
				}),
			);

		new Setting(containerEl)
			.setName('Reset custom callouts')
			.setDesc('Removes all the custom callouts you created.')
			.addButton(
				withConfirm((btn) => {
					btn.setButtonText('Reset').onClick(() => {
						// Remove the stylings for the custom callouts.
						const { settings } = this.plugin;
						for (const custom of settings.callouts.custom) {
							delete settings.callouts.settings[custom];
						}

						// Remove the custom callouts.
						settings.callouts.custom = [];
						this.plugin.saveSettings();

						// Regenerate the callout styles.
						this.plugin.callouts.custom.clear();
						this.plugin.applyStyles();
						btn.setButtonText('Reset').setDisabled(true);
					});
				}),
			);
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withConfirm(callback: (btn: ButtonComponent) => any): (btn: ButtonComponent) => any {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let onClickHandler: undefined | ((...args: any[]) => any) = undefined;
	let resetButtonClicked = false;

	return (btn) => {
		btn.setWarning().onClick(() => {
			if (!resetButtonClicked) {
				resetButtonClicked = true;
				btn.setButtonText('Confirm');
				return;
			}

			if (onClickHandler != undefined) {
				onClickHandler();
			}
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		btn.onClick = (handler: (...args: any[]) => any) => {
			onClickHandler = handler;
			return btn;
		};

		// Call the callback.
		callback(btn);
	};
}

declare const STYLES: `
	.calloutmanager-latest-changes {
		padding: var(--size-4-4);

		.calloutmanager-changelog-section {
			> :first-child { margin-top: 0; }
			> :last-child { margin-bottom: 0; }
		}

		.callout {
			background: none;
		}
	}
`;
