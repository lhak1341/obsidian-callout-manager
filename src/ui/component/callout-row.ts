import { DropdownComponent, Notice, Setting } from 'obsidian';

import { defaultColors } from '../../default_colors.json';
import type { RowSession } from '../../row-session';
import { renderCalloutGlyph } from './callout-glyph';
import { IconSuggest } from './icon-suggest';

export interface CalloutRowOptions {
	/** Rebuilds the whole pane (re-fetches, re-filters, re-sorts, re-renders every row). */
	refresh: () => void;
}

/**
 * A single editable row in {@link ManageCalloutsPane}: icon, name, alias chips, color/icon
 * controls, and a delete button. All edit rules live in the {@link RowSession}; this only wires
 * DOM handlers to it and re-renders what the session's `changed` hint says. The caller never
 * holds a reference to the row past mounting it.
 */
export function makeCalloutRow(row: RowSession, options: CalloutRowOptions) {
	const { callout } = row;

	return {
		render(containerEl: HTMLElement): void {
			new Setting(containerEl).then((setting) => {
				// === Left side: icon (colored to match the callout) + title ===
				const iconEl = setting.nameEl.createSpan({ cls: 'calloutmanager-row-icon' });
				const paintIcon = (iconName: string) =>
					renderCalloutGlyph(iconEl, { icon: iconName || callout.icon, color: row.color || callout.color });
				paintIcon('');

				// === Name: editable inline input (every callout is user-created, so always renamable) ===
				const nameInput = setting.nameEl.createEl('input', {
					cls: 'calloutmanager-row-name-input',
					attr: { type: 'text', value: callout.id },
				});

				const doRename = () => {
					const result = row.rename(nameInput.value);
					if (result.ok) {
						options.refresh();
						return;
					}
					if (result.message) new Notice(result.message);
					nameInput.value = callout.id;
				};
				nameInput.addEventListener('blur', doRename);
				nameInput.addEventListener('keydown', (e) => {
					if (e.key === 'Enter') nameInput.blur();
					if (e.key === 'Escape') { nameInput.value = callout.id; nameInput.blur(); }
				});

				// === Alias chips (all callouts) ===
				{
					const aliasRow = setting.nameEl.createDiv({ cls: 'calloutmanager-row-aliases' });
					const renderChips = () => {
						aliasRow.empty();
						for (const alias of row.aliases) {
							const chip = aliasRow.createSpan({ cls: 'calloutmanager-alias-chip', text: alias });
							chip
								.createEl('button', { cls: 'calloutmanager-alias-chip-remove', text: '×' })
								.addEventListener('click', () => commit(row.removeAlias(alias)));
						}

						const input = aliasRow.createEl('input', {
							cls: 'calloutmanager-alias-input-sm',
							attr: { type: 'text', placeholder: 'Add alias…' },
						});
						const doAdd = () => {
							const result = row.addAlias(input.value);
							if (result.ok) commit(result);
							else input.value = '';
						};
						input.addEventListener('keydown', (e) => {
							if (e.key === 'Enter') doAdd();
						});
						aliasRow
							.createEl('button', { cls: 'calloutmanager-alias-add-btn', text: '+' })
							.addEventListener('click', doAdd);
					};

					const commit = (result: ReturnType<RowSession['addAlias']>) => {
						if (!result.ok) return;
						renderChips();
						if (result.changed === 'list') options.refresh();
					};

					renderChips();
				}

				// === Right side: color dropdown + icon input, or a note for complex (conditional) settings ===
				if (row.isComplex) {
					setting.controlEl.createSpan({
						cls: 'calloutmanager-row-complex-note',
						text: 'Complex settings — edit data.json manually',
					});
				} else {
					new DropdownComponent(setting.controlEl).then((dropdown) => {
						dropdown.addOptions(defaultColors as Record<string, string>);
						dropdown.setValue(row.color);
						dropdown.onChange((value) => {
							row.setColor(value);
							paintIcon(row.icon);
						});
					});

					const iconWrap = setting.controlEl.createSpan({ cls: 'calloutmanager-row-icon-wrap' });
					const iconInput = iconWrap.createEl('input', {
						cls: 'calloutmanager-row-icon-input',
						attr: { type: 'text', placeholder: 'Icon…', value: row.icon },
					});
					new IconSuggest(row.app, iconInput);

					iconInput.addEventListener('input', () => {
						paintIcon(iconInput.value.trim());
					});
					iconInput.addEventListener('change', () => {
						row.setIcon(iconInput.value.trim());
						paintIcon(row.icon);
					});
				}

				// === Delete ===
				setting.addExtraButton((btn) =>
					btn
						.setIcon('lucide-trash')
						.setTooltip('Delete callout')
						.then(({ extraSettingsEl }) => extraSettingsEl.classList.add('mod-warning'))
						.onClick(() => {
							const result = row.remove();
							if (result.ok) options.refresh();
							else new Notice(result.message);
						}),
				);
			});
		},
	};
}
