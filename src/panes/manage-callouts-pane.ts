import { ButtonComponent, DropdownComponent, MarkdownView, Setting, TextComponent, setIcon } from 'obsidian';
import { closeSettings } from 'obsidian-extra/unsafe';

import { Callout } from '&callout';
import { getTitleFromCallout } from '&callout-util';
import { CalloutSettings, CalloutSettingsChanges } from '&callout-settings';
import CalloutManagerPlugin from '&plugin';
import { UIPane } from '&ui/pane';

import { determineAppearanceType } from './edit-callout-pane/appearance-type';

import { defaultColors } from '../default_colors.json';

/**
 * The user interface pane for managing callouts.
 * Each callout is shown as an inline row with color and icon controls.
 * Canonical callouts also show their alias group inline.
 */
export class ManageCalloutsPane extends UIPane {
	public readonly title = { title: 'Callouts', subtitle: 'Manage' };
	private readonly plugin: CalloutManagerPlugin;

	private searchQuery: string;
	private allCallouts: Callout[];
	private filteredCallouts: Callout[];
	private isCreating = false;
	private sortMode: 'name' | 'color' | 'icon' = 'name';

	public constructor(plugin: CalloutManagerPlugin) {
		super();
		this.plugin = plugin;
		this.searchQuery = '';
		this.allCallouts = [];
		this.filteredCallouts = [];
	}

	private refresh(): void {
		this.allCallouts = [...this.plugin.callouts.values()].sort((a, b) => a.id.localeCompare(b.id));
		this.applyFilter();
		this.display();
	}

	private applyFilter(): void {
		const q = this.searchQuery.toLowerCase().trim();
		const aliasGroups = this.plugin.settings.aliasGroups;
		const list = q
			? this.allCallouts.filter(
					(c) =>
						c.id.toLowerCase().includes(q) ||
						getTitleFromCallout(c).toLowerCase().includes(q) ||
						(aliasGroups[c.id] ?? []).some((a) => a.toLowerCase().includes(q)),
				)
			: [...this.allCallouts];

		if (this.sortMode === 'color') {
			list.sort((a, b) => (a.color ?? '').localeCompare(b.color ?? '') || a.id.localeCompare(b.id));
		} else if (this.sortMode === 'icon') {
			list.sort((a, b) => (a.icon ?? '').localeCompare(b.icon ?? '') || a.id.localeCompare(b.id));
		}

		this.filteredCallouts = list;
	}

	/** @override */
	public display(): void {
		const { containerEl } = this;
		const scrollEl = containerEl.parentElement;
		const scrollTop = scrollEl?.scrollTop ?? 0;

		containerEl.empty();

		if (this.isCreating) {
			this.renderCreateRow(containerEl);
		}

		for (const callout of this.filteredCallouts) {
			this.renderCalloutRow(containerEl, callout);
		}

		if (!this.isCreating && this.filteredCallouts.length === 0) {
			containerEl
				.createDiv({ cls: 'calloutmanager-centerbox' })
				.createEl('p', { text: 'No callouts found.', cls: 'calloutmanager-search-empty' });
		}

		if (scrollTop > 0 && scrollEl) {
			activeWindow.requestAnimationFrame(() => { scrollEl.scrollTop = scrollTop; });
		}
	}

	private renderCreateRow(containerEl: HTMLElement): void {
		new Setting(containerEl).then((setting) => {
			setting.settingEl.classList.add('calloutmanager-create-row');

			const iconEl = setting.nameEl.createSpan({ cls: 'calloutmanager-row-icon' });
			setIcon(iconEl, 'lucide-pencil');

			const nameInput = setting.nameEl.createEl('input', {
				cls: 'calloutmanager-row-name-input',
				attr: { type: 'text', placeholder: 'callout-id' },
			});

			const doCreate = () => {
				const id = nameInput.value.trim().toLowerCase().replace(/\s+/g, '-');
				if (!id || !/^[a-z][a-z0-9-]*$/.test(id) || this.plugin.callouts.get(id)) {
					nameInput.focus();
					return;
				}
				this.isCreating = false;
				this.plugin.createCustomCallout(id);
				this.refresh();
			};

			nameInput.addEventListener('keydown', (e) => {
				if (e.key === 'Enter') doCreate();
				if (e.key === 'Escape') {
					this.isCreating = false;
					this.display();
				}
			});

			setting.addExtraButton((btn) =>
				btn
					.setIcon('lucide-check')
					.setTooltip('Create')
					.onClick(doCreate)
					.then(({ extraSettingsEl }) => extraSettingsEl.classList.add('mod-cta')),
			);

			setting.addExtraButton((btn) =>
				btn
					.setIcon('lucide-x')
					.setTooltip('Cancel')
					.onClick(() => {
						this.isCreating = false;
						this.display();
					}),
			);

			activeWindow.setTimeout(() => nameInput.focus(), 0);
		});
	}

	private renderCalloutRow(containerEl: HTMLElement, callout: Callout): void {
		const { plugin } = this;
		const aliasGroups = plugin.settings.aliasGroups;

		// Read current color + icon overrides from saved settings.
		const savedSettings = plugin.getCalloutSettings(callout.id);
		const appearance = savedSettings ? determineAppearanceType(savedSettings) : null;
		let currentColor = appearance?.type === 'unified' ? (appearance.color ?? '') : '';
		let currentIcon = appearance?.type === 'unified' ? (appearance.otherChanges.icon ?? '') : '';

		const save = () => {
			const changes: CalloutSettingsChanges = {};
			if (currentColor) changes.color = currentColor;
			if (currentIcon) changes.icon = currentIcon;
			const newSettings: CalloutSettings = Object.keys(changes).length ? [{ changes }] : [];
			plugin.setCalloutSettings(callout.id, newSettings);
		};

		const isCustomOnly = callout.sources.length === 1 && callout.sources[0].type === 'custom';
		const aliases = aliasGroups[callout.id] as string[] | undefined;

		new Setting(containerEl).then((setting) => {
			// === Left side: icon (colored to match the callout) + title ===
			const iconEl = setting.nameEl.createSpan({ cls: 'calloutmanager-row-icon' });
			setIcon(iconEl, callout.icon || 'lucide-pencil');

			// Resolve a raw color value (CSS var reference like "var(--color-blue)" OR
			// an RGB triplet like "82, 139, 212") to an actual "rgb(...)" string so it
			// can be set as an inline style on the SVG — bypassing any Obsidian class
			// rules that block color inheritance into .svg-icon elements.
			const resolveToRgb = (raw: string): string => {
				if (!raw) return '';
				let value = raw;
				if (raw.startsWith('var(')) {
					const varName = raw.match(/var\((--[^)]+)\)/)?.[1] ?? '';
					if (!varName) return '';
					const probe = activeDocument.body.createDiv();
					value = (activeDocument.defaultView ?? window)
						.getComputedStyle(probe)
						.getPropertyValue(varName)
						.trim();
					probe.remove();
					if (!value) return '';
				}
				// Triplet: "82, 139, 212"
				if (/^\d/.test(value)) return `rgb(${value})`;
				// Hex: "#086ddd" or "#0cf"
				if (value.startsWith('#')) {
					const h = value.slice(1);
					const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
					const r = parseInt(full.slice(0, 2), 16);
					const g = parseInt(full.slice(2, 4), 16);
					const b = parseInt(full.slice(4, 6), 16);
					return isNaN(r) ? '' : `rgb(${r}, ${g}, ${b})`;
				}
				return '';
			};

			const setIconColor = (colorValue: string) => {
				const raw = colorValue || callout.color;
				const rgbColor = resolveToRgb(raw);
				const svgEl = iconEl.querySelector('svg') as SVGElement | null;
				const target = (svgEl as HTMLElement | null) ?? iconEl;
				if (rgbColor) {
					target.style.stroke = rgbColor;
					target.style.color = rgbColor;
				} else {
					target.style.stroke = '';
					target.style.color = '';
				}
			};

			setIconColor(currentColor);

			// === Name: editable inline input for custom callouts, static span otherwise ===
			if (isCustomOnly) {
				const nameInput = setting.nameEl.createEl('input', {
					cls: 'calloutmanager-row-name-input',
					attr: { type: 'text', value: callout.id },
				});
				const doRename = () => {
					const newId = nameInput.value.trim().toLowerCase().replace(/\s+/g, '-');
					if (!newId || newId === callout.id) {
						nameInput.value = callout.id;
						return;
					}
					try {
						plugin.renameCustomCallout(callout.id, newId);
						this.refresh();
					} catch {
						nameInput.value = callout.id;
					}
				};
				nameInput.addEventListener('blur', doRename);
				nameInput.addEventListener('keydown', (e) => {
					if (e.key === 'Enter') nameInput.blur();
					if (e.key === 'Escape') { nameInput.value = callout.id; nameInput.blur(); }
				});
			} else {
				setting.nameEl.createSpan({ text: getTitleFromCallout(callout) });
			}

			// === Alias chips (all callouts) ===
			{
				const currentAliases = aliasGroups[callout.id] ?? [];
				const aliasRow = setting.infoEl.createDiv({ cls: 'calloutmanager-row-aliases' });

				const renderChips = (list: string[]) => {
					aliasRow.empty();
					for (const alias of list) {
						const chip = aliasRow.createSpan({ cls: 'calloutmanager-alias-chip', text: alias });
						chip
							.createEl('button', { cls: 'calloutmanager-alias-chip-remove', text: '×' })
							.addEventListener('click', () => {
								aliasGroups[callout.id] = list.filter((a) => a !== alias);
								if (aliasGroups[callout.id].length === 0) delete aliasGroups[callout.id];
								plugin.saveSettings();
								plugin.applyStyles();
								this.refresh();
							});
					}

					const input = aliasRow.createEl('input', {
						cls: 'calloutmanager-alias-input-sm',
						attr: { type: 'text', placeholder: 'add alias…' },
					});
					const doAdd = () => {
						const val = input.value.trim().toLowerCase();
						if (val && !list.includes(val)) {
							aliasGroups[callout.id] = [...list, val];
							plugin.saveSettings();
							plugin.applyStyles();
							this.refresh();
						} else {
							input.value = '';
						}
					};
					input.addEventListener('keydown', (e) => {
						if (e.key === 'Enter') doAdd();
					});
					aliasRow
						.createEl('button', { cls: 'calloutmanager-alias-add-btn', text: '+' })
						.addEventListener('click', doAdd);
				};

				renderChips(currentAliases);
			}

			// === Right side: color dropdown ===
			new DropdownComponent(setting.controlEl).then((dropdown) => {
				dropdown.addOptions(defaultColors as Record<string, string>);
				dropdown.setValue(currentColor);
				dropdown.onChange((value) => {
					currentColor = value;
					setIconColor(value);
					save();
				});
			});

			// === Icon text input (live preview updates the left icon) ===
			const iconWrap = setting.controlEl.createSpan({ cls: 'calloutmanager-row-icon-wrap' });
			const iconInput = iconWrap.createEl('input', {
				cls: 'calloutmanager-row-icon-input',
				attr: { type: 'text', placeholder: 'icon…', value: currentIcon },
			});

			const refreshIconEl = (iconName: string) => {
				iconEl.empty();
				setIcon(iconEl, iconName || callout.icon || 'lucide-pencil');
				setIconColor(currentColor);
			};

			iconInput.addEventListener('input', () => {
				refreshIconEl(iconInput.value.trim());
			});
			iconInput.addEventListener('change', () => {
				currentIcon = iconInput.value.trim();
				save();
				refreshIconEl(currentIcon);
			});

			// === Insert callout into editor ===
			setting.addExtraButton((btn) =>
				btn
					.setIcon('lucide-forward')
					.setTooltip('Insert callout')
					.onClick(() => {
						const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
						if (view) {
							const cursor = view.editor.getCursor();
							view.editor.replaceRange(`> [!${callout.id}]\n> Contents`, cursor);
							view.editor.setCursor(cursor.line + 1, 10);
							closeSettings(plugin.app);
						}
					}),
			);

			// === Delete (custom-only callouts) ===
			if (isCustomOnly) {
				setting.addExtraButton((btn) =>
					btn
						.setIcon('lucide-trash')
						.setTooltip('Delete callout')
						.then(({ extraSettingsEl }) => extraSettingsEl.classList.add('mod-warning'))
						.onClick(() => {
							plugin.removeCustomCallout(callout.id);
							this.refresh();
						}),
				);
			}
		});
	}

	/** @override */
	public displayControls(): void {
		const { controlsEl } = this;

		new TextComponent(controlsEl)
			.setValue(this.searchQuery)
			.setPlaceholder('Filter callouts…')
			.onChange((q) => {
				this.searchQuery = q;
				this.applyFilter();
				this.display();
			});

		const sortCycle: Array<{ mode: 'name' | 'color' | 'icon'; icon: string; tooltip: string }> = [
			{ mode: 'name',  icon: 'lucide-list',    tooltip: 'Sort: by name' },
			{ mode: 'color', icon: 'lucide-palette', tooltip: 'Sort: by color' },
			{ mode: 'icon',  icon: 'lucide-image',   tooltip: 'Sort: by icon' },
		];
		let sortBtn: ButtonComponent;
		const getSortEntry = () => sortCycle.find((s) => s.mode === this.sortMode)!;
		new ButtonComponent(controlsEl)
			.setIcon(getSortEntry().icon)
			.setTooltip(getSortEntry().tooltip)
			.onClick(() => {
				const idx = sortCycle.findIndex((s) => s.mode === this.sortMode);
				this.sortMode = sortCycle[(idx + 1) % sortCycle.length].mode;
				sortBtn.setIcon(getSortEntry().icon);
				sortBtn.setTooltip(getSortEntry().tooltip);
				this.applyFilter();
				this.display();
			})
			.then((btn) => {
				sortBtn = btn;
				btn.buttonEl.classList.add('clickable-icon');
			});

		new ButtonComponent(controlsEl)
			.setIcon('lucide-plus')
			.setTooltip('New callout')
			.onClick(() => {
				this.isCreating = true;
				this.display();
			})
			.then(({ buttonEl }) => buttonEl.classList.add('clickable-icon'));
	}

	/** @override */
	protected restoreState(_state: unknown): void {
		this.refresh();
	}

	/** @override */
	protected onReady(): void {
		this.refresh();
	}
}

declare const STYLES: `
	.calloutmanager-row-icon {
		display: inline-flex;
		margin-right: 0.35em;
		vertical-align: middle;
	}

	.calloutmanager-row-name-input {
		background: transparent;
		border: none;
		border-bottom: 1px dashed var(--background-modifier-border);
		border-radius: 0;
		color: var(--text-normal);
		font-size: inherit;
		font-weight: inherit;
		padding: 0;
		width: 12em;
		&:focus {
			outline: none;
			border-bottom-color: var(--interactive-accent);
		}
	}

	/* Alias chips row below the callout name */
	.calloutmanager-row-aliases {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 4px;
		padding-top: 4px;
	}

	.calloutmanager-alias-chip {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		padding: 1px 6px;
		border-radius: var(--radius-s);
		background: var(--background-modifier-hover);
		font-size: var(--font-ui-smaller);
		color: var(--text-muted);
	}

	.calloutmanager-alias-chip-remove {
		all: unset;
		cursor: pointer;
		color: var(--text-faint);
		font-size: 1em;
		line-height: 1;
		padding: 0 1px;
		&:hover { color: var(--text-error); }
	}

	.calloutmanager-alias-input-sm {
		height: 20px;
		width: 80px;
		font-size: var(--font-ui-smaller);
		padding: 0 var(--size-4-1);
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--radius-s);
		background: var(--background-primary);
		color: var(--text-normal);
	}

	.calloutmanager-alias-add-btn {
		all: unset;
		cursor: pointer;
		color: var(--text-faint);
		font-size: 1.1em;
		line-height: 1;
		padding: 0 2px;
		&:hover { color: var(--interactive-accent); }
	}

	/* Icon input + live preview */
	.calloutmanager-row-icon-wrap {
		display: inline-flex;
		align-items: center;
		gap: var(--size-4-1);
	}

	.calloutmanager-row-icon-input {
		width: 100px;
		height: var(--input-height);
		font-size: var(--font-ui-small);
		padding: 0 var(--size-4-2);
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--radius-s);
		background: var(--background-primary);
		color: var(--text-normal);
	}

.calloutmanager-search-empty {
		color: var(--text-muted);
		text-align: center;
	}
`;
