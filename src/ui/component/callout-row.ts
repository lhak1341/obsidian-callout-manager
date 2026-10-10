import { DropdownComponent, Notice, Setting } from 'obsidian';

import { Callout } from '&callout';

import { determineAppearanceType, unifiedAppearanceToSettings } from '../../callout-appearance';
import { AliasStore, CalloutReader, CalloutStore } from '../../callout-store';
import { defaultColors } from '../../default_colors.json';
import { isValidCalloutId, slugifyCalloutId } from '../../util/callout-id';
import { renderCalloutGlyph } from './callout-glyph';
import { IconSuggest } from './icon-suggest';

export type CalloutRowStore = CalloutReader &
	AliasStore &
	Pick<CalloutStore, 'setCalloutSettings' | 'renameCustomCallout' | 'removeCustomCallout'>;

export interface CalloutRowOptions {
	/** Rebuilds the whole pane (re-fetches, re-filters, re-sorts, re-renders every row). */
	refresh: () => void;

	/**
	 * Called after this row's alias list changed (the row has already re-rendered its own chips).
	 * The pane decides whether that can affect which rows are visible.
	 */
	onAliasesChanged: () => void;
}

/**
 * A single editable row in {@link ManageCalloutsPane}: icon, name, alias chips, color/icon
 * controls, and (for custom callouts) a delete button. Self-contained — `render()` wires every
 * DOM handler up front, and the row owns its own color/icon/alias state internally afterward.
 * The caller never holds a reference to the row past mounting it, same as it does for the
 * DOM it replaces.
 */
export function makeCalloutRow(callout: Callout, store: CalloutRowStore, options: CalloutRowOptions) {
	return {
		render(containerEl: HTMLElement): void {
			const aliasGroups = store.getAliasGroups();

			// Read current color + icon overrides from saved settings.
			const savedSettings = store.getCalloutSettings(callout.id);
			const appearance = savedSettings ? determineAppearanceType(savedSettings) : null;
			// Inline color/icon editing is only valid for 'unified' appearance; 'complex' settings
			// (conditional, duplicate-key, or anything beyond color/icon) must be refused here.
			const isComplex = appearance?.type === 'complex';
			let currentColor = appearance?.type === 'unified' ? (appearance.color ?? '') : '';
			let currentIcon = appearance?.type === 'unified' ? (appearance.otherChanges.icon ?? '') : '';

			const save = () => {
				store.setCalloutSettings(callout.id, unifiedAppearanceToSettings(currentColor, currentIcon));
			};

			new Setting(containerEl).then((setting) => {
				// === Left side: icon (colored to match the callout) + title ===
				const iconEl = setting.nameEl.createSpan({ cls: 'calloutmanager-row-icon' });
				const paintIcon = (iconName: string) =>
					renderCalloutGlyph(iconEl, { icon: iconName || callout.icon, color: currentColor || callout.color });
				paintIcon('');

				// === Name: editable inline input (every callout is user-created, so always renamable) ===
				const nameInput = setting.nameEl.createEl('input', {
					cls: 'calloutmanager-row-name-input',
					attr: { type: 'text', value: callout.id },
				});
				const doRename = () => {
					const newId = slugifyCalloutId(nameInput.value);
					if (!newId || newId === callout.id) {
						nameInput.value = callout.id;
						return;
					}
					try {
						store.renameCustomCallout(callout.id, newId);
						options.refresh();
					} catch (error) {
						new Notice(error instanceof Error ? error.message : String(error));
						nameInput.value = callout.id;
					}
				};
				nameInput.addEventListener('blur', doRename);
				nameInput.addEventListener('keydown', (e) => {
					if (e.key === 'Enter') nameInput.blur();
					if (e.key === 'Escape') { nameInput.value = callout.id; nameInput.blur(); }
				});

				// === Alias chips (all callouts) ===
				{
					const currentAliases = aliasGroups[callout.id] ?? [];
					const aliasRow = setting.nameEl.createDiv({ cls: 'calloutmanager-row-aliases' });

					const renderChips = (list: string[]) => {
						aliasRow.empty();
						for (const alias of list) {
							const chip = aliasRow.createSpan({ cls: 'calloutmanager-alias-chip', text: alias });
							chip
								.createEl('button', { cls: 'calloutmanager-alias-chip-remove', text: '×' })
								.addEventListener('click', () => {
									commitAliasChange(list.filter((a) => a !== alias));
								});
						}

						const input = aliasRow.createEl('input', {
							cls: 'calloutmanager-alias-input-sm',
							attr: { type: 'text', placeholder: 'Add alias…' },
						});
						const doAdd = () => {
							const val = input.value.trim().toLowerCase();
							if (val && !list.includes(val) && val !== callout.id && isValidCalloutId(val)) {
								commitAliasChange([...list, val]);
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

					const commitAliasChange = (newList: string[]) => {
						store.setAliasGroup(callout.id, newList);
						renderChips(newList);
						options.onAliasesChanged();
					};

					renderChips(currentAliases);
				}

				// === Right side: color dropdown + icon input, or a note for complex (conditional) settings ===
				if (isComplex) {
					setting.controlEl.createSpan({
						cls: 'calloutmanager-row-complex-note',
						text: 'Complex settings — edit data.json manually',
					});
				} else {
					new DropdownComponent(setting.controlEl).then((dropdown) => {
						dropdown.addOptions(defaultColors as Record<string, string>);
						dropdown.setValue(currentColor);
						dropdown.onChange((value) => {
							currentColor = value;
							paintIcon(currentIcon);
							save();
						});
					});

					const iconWrap = setting.controlEl.createSpan({ cls: 'calloutmanager-row-icon-wrap' });
					const iconInput = iconWrap.createEl('input', {
						cls: 'calloutmanager-row-icon-input',
						attr: { type: 'text', placeholder: 'Icon…', value: currentIcon },
					});
					new IconSuggest(store.app, iconInput);

					iconInput.addEventListener('input', () => {
						paintIcon(iconInput.value.trim());
					});
					iconInput.addEventListener('change', () => {
						currentIcon = iconInput.value.trim();
						save();
						paintIcon(currentIcon);
					});
				}

				// === Delete ===
				setting.addExtraButton((btn) =>
					btn
						.setIcon('lucide-trash')
						.setTooltip('Delete callout')
						.then(({ extraSettingsEl }) => extraSettingsEl.classList.add('mod-warning'))
						.onClick(() => {
							store.removeCustomCallout(callout.id);
							options.refresh();
						}),
				);
			});
		},
	};
}
