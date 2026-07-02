import { MarkdownView, Modal, setIcon } from 'obsidian';

import { Callout } from '&callout';
import { getTitleFromCallout } from '&callout-util';
import { CalloutStore } from '../callout-store';
import { CalloutPreviewComponent } from '&ui/component/callout-preview';

export class InsertCalloutModal extends Modal {
	private readonly plugin: CalloutStore;
	private allCallouts: Callout[];
	private filteredCallouts: Callout[];
	private selectedCallout: Callout | null = null;
	private foldState: '' | '+' | '-' = '';
	private titleValue = '';
	private contentValue = '';
	private searchQuery = '';

	private gridEl: HTMLElement | null = null;
	private previewContainer: HTMLElement | null = null;

	public constructor(plugin: CalloutStore) {
		super(plugin.app);
		this.plugin = plugin;
		this.allCallouts = [...plugin.getCallouts()].sort((a, b) => a.id.localeCompare(b.id));
		this.filteredCallouts = [...this.allCallouts];
		if (this.allCallouts.length > 0) {
			this.selectedCallout = this.allCallouts[0];
		}

		// Pre-fill content from editor selection.
		const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
		if (view) {
			const sel = view.editor.getSelection();
			if (sel) this.contentValue = sel;
		}
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
			this.searchQuery = searchEl.value;
			this.applyFilter();
			// Keep selection live: auto-pick the first visible match.
			if (this.filteredCallouts.length > 0 &&
				!this.filteredCallouts.some((c) => c.id === this.selectedCallout?.id)) {
				this.selectedCallout = this.filteredCallouts[0];
			}
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

		const activateFold = (idx: number) => {
			this.foldState = foldOptions[idx].value;
			foldBtns.forEach((b, i) => {
				b.toggleClass('is-active', i === idx);
				b.tabIndex = i === idx ? 0 : -1;
			});
			this.refreshPreview();
		};

		for (let i = 0; i < foldOptions.length; i++) {
			const opt = foldOptions[i];
			const isActive = this.foldState === opt.value;
			const btn = foldRow.createEl('button', {
				text: opt.label,
				cls: 'calloutmanager-insert-fold-btn' + (isActive ? ' is-active' : ''),
				attr: { tabindex: isActive ? '0' : '-1' },
			});
			const capturedIdx = i;
			btn.addEventListener('click', () => activateFold(capturedIdx));
			btn.addEventListener('keydown', (e: KeyboardEvent) => {
				if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
					e.preventDefault();
					const next = (capturedIdx + 1) % foldOptions.length;
					activateFold(next);
					foldBtns[next].focus();
				} else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
					e.preventDefault();
					const prev = (capturedIdx - 1 + foldOptions.length) % foldOptions.length;
					activateFold(prev);
					foldBtns[prev].focus();
				}
			});
			foldBtns.push(btn);
		}

		// === Title ===
		const titleRow = root.createDiv({ cls: 'calloutmanager-insert-option-row' });
		titleRow.createEl('label', { cls: 'calloutmanager-insert-option-label', text: 'Title' });
		const titleInput = titleRow.createEl('input', {
			cls: 'calloutmanager-insert-title-input',
			attr: { type: 'text', placeholder: 'Leave blank for default' },
		});
		titleInput.value = this.titleValue;
		titleInput.addEventListener('input', () => {
			this.titleValue = titleInput.value;
			this.refreshPreview();
		});

		// === Content ===
		const contentRow = root.createDiv({ cls: 'calloutmanager-insert-option-row' });
		contentRow.createEl('label', { cls: 'calloutmanager-insert-option-label', text: 'Content' });
		const contentTextarea = contentRow.createEl('textarea', {
			cls: 'calloutmanager-insert-content-input',
			attr: { placeholder: 'Callout body text…', rows: '3' },
		});
		contentTextarea.value = this.contentValue;
		contentTextarea.addEventListener('input', () => {
			this.contentValue = contentTextarea.value;
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

		activeWindow.setTimeout(() => searchEl.focus(), 0);
	}

	private applyFilter(): void {
		const q = this.searchQuery.toLowerCase().trim();
		if (!q) {
			this.filteredCallouts = [...this.allCallouts];
			return;
		}
		this.filteredCallouts = this.allCallouts.filter(
			(c) => c.id.toLowerCase().includes(q) || getTitleFromCallout(c).toLowerCase().includes(q),
		);
	}

	private refreshGrid(): void {
		const { gridEl } = this;
		if (!gridEl) return;
		gridEl.empty();

		const chips: HTMLElement[] = [];
		for (let i = 0; i < this.filteredCallouts.length; i++) {
			const callout = this.filteredCallouts[i];
			const isSelected = this.selectedCallout?.id === callout.id;
			const chip = gridEl.createDiv({
				cls: 'calloutmanager-insert-chip' + (isSelected ? ' is-selected' : ''),
				attr: { tabindex: '0' },
			});
			chips.push(chip);

			const iconEl = chip.createSpan({ cls: 'calloutmanager-insert-chip-icon' });
			setIcon(iconEl, callout.icon || 'lucide-pencil');
			this.applyIconColor(iconEl, callout.color ?? '');

			chip.createSpan({ cls: 'calloutmanager-insert-chip-label', text: getTitleFromCallout(callout) });

			const capturedIdx = i;
			const select = () => {
				this.selectedCallout = callout;
				this.refreshGrid();
				this.refreshPreview();
			};
			chip.addEventListener('click', select);
			chip.addEventListener('keydown', (e: KeyboardEvent) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					select();
				} else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
					e.preventDefault();
					chips[(capturedIdx + 1) % chips.length]?.focus();
				} else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
					e.preventDefault();
					chips[(capturedIdx - 1 + chips.length) % chips.length]?.focus();
				}
			});
		}

		if (this.filteredCallouts.length === 0) {
			gridEl.createEl('p', { cls: 'calloutmanager-insert-empty', text: 'No callouts found.' });
		}
	}

	private applyIconColor(iconEl: HTMLElement, raw: string): void {
		if (!raw) return;
		let value = raw;
		if (raw.startsWith('var(')) {
			const varName = raw.match(/var\((--[^)]+)\)/)?.[1] ?? '';
			if (!varName) return;
			const probe = activeDocument.body.createDiv();
			value = (activeDocument.defaultView ?? window).getComputedStyle(probe).getPropertyValue(varName).trim();
			probe.remove();
			if (!value) return;
		}
		let rgb = '';
		if (/^\d/.test(value)) {
			rgb = `rgb(${value})`;
		} else if (value.startsWith('#')) {
			const h = value.slice(1);
			const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
			const r = parseInt(full.slice(0, 2), 16);
			const g = parseInt(full.slice(2, 4), 16);
			const b = parseInt(full.slice(4, 6), 16);
			if (!isNaN(r)) rgb = `rgb(${r}, ${g}, ${b})`;
		}
		if (rgb) iconEl.style.setProperty('--calloutmanager-insert-icon-color', rgb);
	}

	private refreshPreview(): void {
		const { previewContainer, selectedCallout } = this;
		if (!previewContainer) return;
		previewContainer.empty();
		if (!selectedCallout) return;

		const title = this.titleValue.trim() || getTitleFromCallout(selectedCallout);
		const content = this.contentValue.trim() || undefined;

		new CalloutPreviewComponent(previewContainer, {
			id: selectedCallout.id,
			icon: selectedCallout.icon || 'lucide-pencil',
			title,
			content,
		});
	}

	private doInsert(): void {
		if (!this.selectedCallout) return;

		const { id } = this.selectedCallout;
		const fold = this.foldState;
		const title = this.titleValue.trim() || '%% %%';
		const rawContent = this.contentValue.trim();
		const body = rawContent ? rawContent.replace(/\n/g, '\n> ') : ' ';

		const markdown = `> [!${id}]${fold} ${title}\n> ${body}`;

		const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		if (view) {
			const cursor = view.editor.getCursor();
			view.editor.replaceRange(markdown, cursor);
			const lines = markdown.split('\n');
			view.editor.setCursor(cursor.line + lines.length - 1, lines[lines.length - 1].length);
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
			stroke: var(--calloutmanager-insert-icon-color, var(--text-muted));
			color: var(--calloutmanager-insert-icon-color, var(--text-muted));
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
