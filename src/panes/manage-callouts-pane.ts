import { ButtonComponent, Notice, Setting, TextComponent, setIcon } from 'obsidian';

import { Callout } from '&callout';
import { CalloutStore } from '../callout-store';
import { UIPane } from '&ui/pane';

import { ManageSession, SortMode } from '../manage-session';
import { DEFAULT_ICON_ID } from '../lucide-icons';
import { makeCalloutRow } from '&ui/component/callout-row';
import { renderIconColorAdjustSection } from '&ui/component/icon-color-adjust-section';

/**
 * The user interface pane for managing callouts.
 * Each callout is shown as an inline row with color and icon controls.
 * Canonical callouts also show their alias group inline.
 */
export class ManageCalloutsPane extends UIPane {
	public readonly title = { title: 'Callouts', subtitle: 'Manage' };
	private readonly plugin: CalloutStore;
	private readonly session: ManageSession;

	private listEl: HTMLElement | null = null;

	/** @param options.query Pre-fills the filter, e.g. to land on one callout from the editor. */
	public constructor(plugin: CalloutStore, options: { query?: string } = {}) {
		super();
		this.plugin = plugin;
		this.session = new ManageSession(plugin);
		if (options.query) this.session.setQuery(options.query);
	}

	/** Re-reads the callouts and rebuilds the list (not the slider section). */
	private refresh(): void {
		this.session.reload();
		this.renderList();
	}

	/** @override */
	public display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// The slider section never changes with the list, so it is built once per display() and
		// the list below is rebuilt on its own (see renderList).
		renderIconColorAdjustSection(containerEl, this.plugin);
		this.listEl = containerEl.createDiv();
		this.renderList();
	}

	private renderList(): void {
		const { containerEl, listEl } = this;
		if (!listEl) return;

		const scrollEl = containerEl.parentElement;
		const scrollTop = scrollEl?.scrollTop ?? 0;

		listEl.empty();

		if (!this.session.isCreating && this.session.visible.length === 0) {
			listEl
				.createDiv({ cls: 'calloutmanager-centerbox' })
				.createEl('p', { text: 'No callouts found.', cls: 'calloutmanager-search-empty' });
		} else {
			const itemsEl = listEl.createDiv('setting-group').createDiv('setting-items');

			if (this.session.isCreating) {
				this.renderCreateRow(itemsEl);
			}

			for (const callout of this.session.visible) {
				this.renderCalloutRow(itemsEl, callout);
			}
		}

		if (scrollTop > 0 && scrollEl) {
			window.requestAnimationFrame(() => { scrollEl.scrollTop = scrollTop; });
		}
	}

	private renderCreateRow(containerEl: HTMLElement): void {
		new Setting(containerEl).then((setting) => {
			setting.settingEl.classList.add('calloutmanager-create-row');

			const iconEl = setting.nameEl.createSpan({ cls: 'calloutmanager-row-icon' });
			setIcon(iconEl, DEFAULT_ICON_ID);

			const nameInput = setting.nameEl.createEl('input', {
				cls: 'calloutmanager-row-name-input',
				attr: { type: 'text', placeholder: 'Callout-id' },
			});

			const doCreate = () => {
				const result = this.session.create(nameInput.value);
				if (result.ok) {
					this.renderList();
					return;
				}
				if (result.message) new Notice(result.message);
				nameInput.focus();
			};

			nameInput.addEventListener('keydown', (e) => {
				if (e.key === 'Enter') doCreate();
				if (e.key === 'Escape') {
					this.session.cancelCreating();
					this.renderList();
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
						this.session.cancelCreating();
						this.renderList();
					}),
			);

			window.setTimeout(() => nameInput.focus(), 0);
		});
	}

	private renderCalloutRow(containerEl: HTMLElement, callout: Callout): void {
		makeCalloutRow(this.session.rowFor(callout), { refresh: () => this.refresh() }).render(containerEl);
	}

	/** @override */
	public displayControls(): void {
		const { controlsEl } = this;

		new TextComponent(controlsEl)
			.setValue(this.session.searchQuery)
			.setPlaceholder('Filter callouts…')
			.onChange((q) => {
				this.session.setQuery(q);
				this.renderList();
			});

		const sortCycle: Array<{ mode: SortMode; icon: string; tooltip: string }> = [
			{ mode: 'name',  icon: 'lucide-list',    tooltip: 'Sort: by name' },
			{ mode: 'color', icon: 'lucide-palette', tooltip: 'Sort: by color' },
			{ mode: 'icon',  icon: 'lucide-image',   tooltip: 'Sort: by icon' },
		];
		let sortBtn: ButtonComponent;
		const getSortEntry = () => sortCycle.find((s) => s.mode === this.session.sortMode)!;
		new ButtonComponent(controlsEl)
			.setIcon(getSortEntry().icon)
			.setTooltip(getSortEntry().tooltip)
			.onClick(() => {
				this.session.cycleSort();
				sortBtn.setIcon(getSortEntry().icon);
				sortBtn.setTooltip(getSortEntry().tooltip);
				this.renderList();
			})
			.then((btn) => {
				sortBtn = btn;
				btn.buttonEl.classList.add('clickable-icon');
			});

		new ButtonComponent(controlsEl)
			.setIcon('lucide-plus')
			.setTooltip('New callout')
			.onClick(() => {
				this.session.startCreating();
				this.renderList();
			})
			.then(({ buttonEl }) => buttonEl.classList.add('clickable-icon'));
	}

	/** @override */
	protected onReady(): void {
		this.session.reload();
	}
}

declare const STYLES: `
	.calloutmanager-row-icon {
		display: inline-flex;
		margin-right: 0.35em;
		vertical-align: middle;
	}

	.calloutmanager-row-complex-note {
		color: var(--text-muted);
		font-size: var(--font-ui-smaller);
		font-style: italic;
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

	/* Alias chips inline with the callout name */
	.calloutmanager-row-aliases {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 4px;
		margin-left: 6px;
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
