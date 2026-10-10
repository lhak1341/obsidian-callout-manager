import { Editor, Modal } from 'obsidian';

import { Callout } from '&callout';
import { getTitleFromCallout } from '&callout-util';
import { InsertSession } from '../insert-session';
import { AliasReader, CalloutReader } from '../callout-store';
import { DEFAULT_ICON_ID } from '../lucide-icons';
import { renderCalloutGlyph } from '&ui/component/callout-glyph';
import { CalloutPreviewComponent } from '&ui/component/callout-preview';
import { attachRovingTabindex, RovingTabindexHandle } from '&ui/component/roving-tabindex';

export class InsertCalloutModal extends Modal {
	private readonly session: InsertSession;
	private readonly editor: Editor | null;

	private gridEl: HTMLElement | null = null;
	private previewContainer: HTMLElement | null = null;

	public constructor(plugin: CalloutReader & AliasReader, editor: Editor | null) {
		super(plugin.app);
		this.editor = editor;
		this.session = new InsertSession(plugin.getCallouts(), {
			aliasGroups: plugin.getAliasGroups(),
			initialContent: editor?.getSelection() || undefined,
		});
	}

	public onOpen(): void {
		this.modalEl.addClass('calloutmanager-insert-modal');
		this.contentEl.empty();
		this.buildUI(this.contentEl);
	}

	public onClose(): void {
		this.contentEl.empty();
	}

	private buildUI(root: HTMLElement): void {
		// === Search ===
		const searchEl = root.createEl('input', {
			cls: 'calloutmanager-insert-search',
			attr: { type: 'text', placeholder: 'Search callouts…' },
		});

		// === Callout grid ===
		this.gridEl = root.createDiv({ cls: 'calloutmanager-insert-grid' });
		this.refreshGrid();

		// Auto-select first result and navigate on keydown from search.
		searchEl.addEventListener('input', () => {
			this.session.setQuery(searchEl.value);
			this.refreshGrid();
			this.refreshPreview();
		});
		searchEl.addEventListener('keydown', (e: KeyboardEvent) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				titleInput.focus();
			} else if (e.key === 'ArrowDown') {
				e.preventDefault();
				const first = this.gridEl?.querySelector<HTMLElement>('.calloutmanager-insert-chip');
				first?.focus();
			}
		});

		// === Fold state (roving tabindex — single Tab stop, arrow keys to switch) ===
		const foldRow = root.createDiv({ cls: 'calloutmanager-insert-option-row' });
		foldRow.createSpan({ cls: 'calloutmanager-insert-option-label', text: 'Folding' });
		const foldOptions: Array<{ value: '' | '+' | '-'; label: string }> = [
			{ value: '', label: 'None' },
			{ value: '+', label: 'Expanded' },
			{ value: '-', label: 'Collapsed' },
		];
		const foldBtns: HTMLButtonElement[] = [];

		for (let i = 0; i < foldOptions.length; i++) {
			const opt = foldOptions[i];
			const isActive = this.session.fold === opt.value;
			const btn = foldRow.createEl('button', {
				text: opt.label,
				cls: 'calloutmanager-insert-fold-btn' + (isActive ? ' is-active' : ''),
			});
			foldBtns.push(btn);
		}

		let foldRoving: RovingTabindexHandle;
		const activateFold = (idx: number) => {
			this.session.setFold(foldOptions[idx].value);
			foldBtns.forEach((b, i) => b.toggleClass('is-active', i === idx));
			foldRoving.setActive(idx);
			this.refreshPreview();
		};
		foldRoving = attachRovingTabindex(
			foldBtns,
			foldOptions.findIndex((o) => o.value === this.session.fold),
			{ activation: 'auto', onActivate: activateFold },
		);
		foldBtns.forEach((btn, i) => btn.addEventListener('click', () => activateFold(i)));

		// === Title ===
		const titleRow = root.createDiv({ cls: 'calloutmanager-insert-option-row' });
		titleRow.createEl('label', { cls: 'calloutmanager-insert-option-label', text: 'Title' });
		const titleInput = titleRow.createEl('input', {
			cls: 'calloutmanager-insert-title-input',
			attr: { type: 'text', placeholder: 'Leave blank for default' },
		});
		titleInput.value = this.session.title;
		titleInput.addEventListener('input', () => {
			this.session.setTitle(titleInput.value);
			this.refreshPreview();
		});

		// === Content ===
		const contentRow = root.createDiv({ cls: 'calloutmanager-insert-option-row' });
		contentRow.createEl('label', { cls: 'calloutmanager-insert-option-label', text: 'Content' });
		const contentTextarea = contentRow.createEl('textarea', {
			cls: 'calloutmanager-insert-content-input',
			attr: { placeholder: 'Callout body text…', rows: '3' },
		});
		contentTextarea.value = this.session.content;
		contentTextarea.addEventListener('input', () => {
			this.session.setContent(contentTextarea.value);
			this.refreshPreview();
		});
		// Cmd/Ctrl+Enter to insert from inside the textarea.
		contentTextarea.addEventListener('keydown', (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
				e.preventDefault();
				this.doInsert();
			}
		});

		// === Preview ===
		const previewSection = root.createDiv({ cls: 'calloutmanager-insert-preview-section' });
		previewSection.createSpan({ cls: 'calloutmanager-insert-option-label', text: 'Preview' });
		this.previewContainer = previewSection.createDiv();
		this.refreshPreview();

		// === Buttons ===
		const btnRow = root.createDiv({ cls: 'calloutmanager-insert-buttons' });
		btnRow.createEl('button', { text: 'Cancel' }).addEventListener('click', () => this.close());
		btnRow.createEl('button', { text: 'Insert', cls: 'mod-cta' }).addEventListener('click', () => this.doInsert());

		// Enter anywhere outside the textarea confirms.
		root.addEventListener('keydown', (e: KeyboardEvent) => {
			if (e.key === 'Enter' && !e.shiftKey && e.target !== contentTextarea) {
				e.preventDefault();
				this.doInsert();
			}
		});

		window.setTimeout(() => searchEl.focus(), 0);
	}

	private refreshGrid(): void {
		const { gridEl } = this;
		if (!gridEl) return;
		gridEl.empty();

		const { filtered, selected } = this.session;
		const select = (callout: Callout) => {
			this.session.select(callout.id);
			this.refreshGrid();
			this.refreshPreview();
		};

		const chips: HTMLElement[] = [];
		for (let i = 0; i < filtered.length; i++) {
			const callout = filtered[i];
			const isSelected = selected?.id === callout.id;
			const chip = gridEl.createDiv({
				cls: 'calloutmanager-insert-chip' + (isSelected ? ' is-selected' : ''),
			});
			chips.push(chip);

			const iconEl = chip.createSpan({ cls: 'calloutmanager-insert-chip-icon' });
			renderCalloutGlyph(iconEl, callout);

			chip.createSpan({ cls: 'calloutmanager-insert-chip-label', text: getTitleFromCallout(callout) });

			chip.addEventListener('click', () => select(callout));
		}

		if (chips.length > 0) {
			const activeIdx = Math.max(
				0,
				filtered.findIndex((c) => c.id === selected?.id),
			);
			attachRovingTabindex(chips, activeIdx, {
				activation: 'manual',
				onActivate: (idx) => select(filtered[idx]),
			});
		}

		if (filtered.length === 0) {
			gridEl.createEl('p', { cls: 'calloutmanager-insert-empty', text: 'No callouts found.' });
		}
	}

	private refreshPreview(): void {
		const { previewContainer } = this;
		if (!previewContainer) return;
		previewContainer.empty();

		const preview = this.session.preview();
		const callout = this.session.selected;
		if (!preview || !callout) return;

		new CalloutPreviewComponent(previewContainer, {
			...preview,
			icon: callout.icon || DEFAULT_ICON_ID,
		});
	}

	private doInsert(): void {
		const { editor } = this;
		if (editor) {
			const from = editor.getCursor('from');
			const insertion = this.session.toInsertion(from);
			if (insertion) {
				editor.replaceRange(insertion.text, from, editor.getCursor('to'));
				editor.setCursor(insertion.cursor.line, insertion.cursor.ch);
			}
		}

		this.close();
	}
}

// ---------------------------------------------------------------------------------------------------------------------
// Styles:
// ---------------------------------------------------------------------------------------------------------------------

declare const STYLES: `
	.calloutmanager-insert-modal {
		width: min(680px, 90vw);

		.modal-content {
			display: flex;
			flex-direction: column;
			gap: var(--size-4-3);
			padding: var(--size-4-4);
		}
	}

	.calloutmanager-insert-search {
		width: 100%;
		height: var(--input-height);
		padding: 0 var(--size-4-3);
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--radius-m);
		background: var(--background-primary);
		color: var(--text-normal);
		font-size: var(--font-ui-medium);
	}

	.calloutmanager-insert-grid {
		display: flex;
		flex-wrap: wrap;
		gap: var(--size-4-1);
		max-height: 180px;
		overflow-y: auto;
		padding: var(--size-4-2);
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--radius-m);
		background: var(--background-secondary);
	}

	.calloutmanager-insert-chip {
		display: inline-flex;
		align-items: center;
		gap: var(--size-4-1);
		padding: 3px 8px;
		border-radius: var(--radius-s);
		background: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		cursor: pointer;
		user-select: none;
		transition: border-color 0.1s, background 0.1s;

		&:hover {
			background: var(--background-modifier-hover);
			border-color: var(--interactive-accent);
		}

		&.is-selected {
			background: var(--interactive-accent);
			border-color: var(--interactive-accent);
			color: var(--text-on-accent);

			.calloutmanager-insert-chip-icon svg,
			.calloutmanager-insert-chip-icon .svg-icon {
				stroke: var(--text-on-accent);
				color: var(--text-on-accent);
			}
		}
	}

	.calloutmanager-insert-chip-icon {
		display: inline-flex;
		width: 16px;
		height: 16px;
		flex-shrink: 0;

		svg, .svg-icon {
			width: 16px;
			height: 16px;
		}
	}

	.calloutmanager-insert-chip-label {
		font-size: var(--font-ui-small);
		white-space: nowrap;
	}

	.calloutmanager-insert-empty {
		color: var(--text-muted);
		font-size: var(--font-ui-small);
		width: 100%;
		text-align: center;
		margin: 0;
		padding: var(--size-4-2) 0;
	}

	.calloutmanager-insert-option-row {
		display: flex;
		align-items: center;
		gap: var(--size-4-2);
	}

	.calloutmanager-insert-option-label {
		font-size: var(--font-ui-smaller);
		color: var(--text-muted);
		min-width: 52px;
		flex-shrink: 0;
	}

	.calloutmanager-insert-fold-btn {
		padding: 2px 10px;
		border-radius: var(--radius-s);
		font-size: var(--font-ui-small);
		background: var(--background-modifier-hover);
		border: 1px solid var(--background-modifier-border);
		color: var(--text-normal);
		cursor: pointer;

		&:hover {
			border-color: var(--interactive-accent);
		}

		&.is-active {
			background: var(--interactive-accent);
			border-color: var(--interactive-accent);
			color: var(--text-on-accent);
		}
	}

	.calloutmanager-insert-title-input {
		flex: 1;
		height: var(--input-height);
		padding: 0 var(--size-4-2);
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--radius-s);
		background: var(--background-primary);
		color: var(--text-normal);
		font-size: var(--font-ui-small);
	}

	.calloutmanager-insert-content-input {
		flex: 1;
		padding: var(--size-4-2);
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--radius-s);
		background: var(--background-primary);
		color: var(--text-normal);
		font-size: var(--font-ui-small);
		resize: vertical;
		font-family: var(--font-monospace);
		line-height: var(--line-height-normal);
	}

	.calloutmanager-insert-preview-section {
		display: flex;
		flex-direction: column;
		gap: var(--size-4-1);
	}

	.calloutmanager-insert-buttons {
		display: flex;
		justify-content: flex-end;
		gap: var(--size-4-2);
	}
`;
