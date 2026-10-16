import { type Editor, EditorSuggest, type EditorPosition, type EditorSuggestContext, type EditorSuggestTriggerInfo, type Menu, Notice, type Plugin, setIcon } from 'obsidian';

import { calloutMarkdown, findCalloutAt, planFold, planUnwrap, wrapRange } from './callout-block';
import type { CalloutStore } from './callout-store';
import { type Choice, choicesFor, planPick, readTrigger } from './callout-trigger';
import type { FoldState, Selection } from './callout-writer';
import { InsertCalloutModal } from './panes/insert-callout-modal';
import { ManageCalloutsPane } from './panes/manage-callouts-pane';
import type { UISettingTab } from '&ui/paned-setting-tab';
import { toCssColor } from '&color';

/** What the editor integrations need from the plugin. */
export interface EditorFeatureHost {
	plugin: Plugin;
	store: CalloutStore;
	settingTab: UISettingTab;
}

const linesOf = (editor: Editor) => editor.getValue().split('\n');
const selectionOf = (editor: Editor): Selection => ({ from: editor.getCursor('from'), to: editor.getCursor('to') });

/** Registers the commands, the `[!` suggestions and the right-click menu items for callouts in notes. */
export function registerEditorFeatures(host: EditorFeatureHost): void {
	const { plugin, store } = host;

	plugin.addCommand({
		id: 'wrap-in-callout',
		name: 'Wrap in callout',
		editorCallback: (editor) => {
			// Whole lines of the selection, or the paragraph under the cursor; a blank line or a
			// heading has nothing to wrap, so the callout is just inserted there.
			const selection = wrapRange(linesOf(editor), selectionOf(editor)) ?? selectionOf(editor);
			new InsertCalloutModal(store, editor, selection).open();
		},
	});

	plugin.addCommand({
		id: 'unwrap-callout',
		name: 'Unwrap callout',
		editorCallback: (editor) => {
			const lines = linesOf(editor);
			const block = findCalloutAt(lines, editor.getCursor().line);
			if (!block) {
				new Notice('Click inside a callout to unwrap it.');
				return;
			}
			applyEdit(editor, planUnwrap(lines, block));
		},
	});

	plugin.registerEditorSuggest(new CalloutSuggest(host));
	registerContextMenu(host);
}

function applyEdit(editor: Editor, edit: { from: EditorPosition; to: EditorPosition; text: string; cursor?: EditorPosition }): void {
	editor.replaceRange(edit.text, edit.from, edit.to);
	if (edit.cursor) editor.setCursor(edit.cursor);
}

/** `[!` autocomplete in a callout header. The rules live in `callout-trigger.ts`. */
class CalloutSuggest extends EditorSuggest<Choice> {
	private readonly store: CalloutStore;

	public constructor({ plugin, store }: EditorFeatureHost) {
		super(plugin.app);
		this.store = store;
	}

	public onTrigger(cursor: EditorPosition, editor: Editor): EditorSuggestTriggerInfo | null {
		// Asked on every keystroke: rule out lines that cannot hold a header before reading the note.
		if (!editor.getLine(cursor.line).includes('[!')) return null;

		const trigger = readTrigger(linesOf(editor), cursor.line, cursor.ch);
		if (!trigger) return null;
		return { start: { line: trigger.line, ch: trigger.idStart }, end: { line: trigger.line, ch: trigger.idEnd }, query: trigger.id };
	}

	public getSuggestions(context: EditorSuggestContext): Choice[] {
		return choicesFor(this.store.getCallouts(), this.store.getAliasGroups(), context.query);
	}

	public renderSuggestion(choice: Choice, el: HTMLElement): void {
		el.addClass('calloutmanager-icon-suggest-item');
		const icon = el.createSpan({ cls: 'calloutmanager-icon-suggest-icon' });
		if (choice.kind === 'create') {
			setIcon(icon, 'lucide-plus');
			el.createSpan({ text: `Create "${choice.id}"` });
			return;
		}

		setIcon(icon, choice.callout.icon || 'lucide-pencil');
		if (choice.callout.color) icon.style.color = toCssColor(choice.callout.color);
		el.createSpan({ text: choice.callout.id });
	}

	public selectSuggestion(choice: Choice): void {
		const { context } = this;
		if (!context) return;
		const { editor } = context;

		// Re-read the note: this runs after the popup was open for an unknown time.
		const lines = linesOf(editor);
		const trigger = readTrigger(lines, context.start.line, context.start.ch);
		this.close();
		if (!trigger) return;

		let id: string;
		if (choice.kind === 'create') {
			try {
				this.store.createCustomCallout(choice.id);
			} catch (error) {
				new Notice(error instanceof Error ? error.message : String(error));
				return;
			}
			new Notice(`Created callout "${choice.id}". Style it in the Callout Manager settings.`);
			id = choice.id;
		} else {
			id = choice.callout.id;
		}

		const edit = planPick(lines, trigger, id);
		editor.replaceRange(edit.text, edit.from, edit.to);
		// Obsidian restores its own selection as the popup closes, so place the cursor afterwards.
		window.setTimeout(() => {
			if (editor.getLine(edit.cursor.line) !== undefined) editor.setCursor(edit.cursor);
		}, 50);
	}
}

/**
 * Adds callout actions to the editor's right-click menu when the click is inside a callout. The
 * clicked line comes from the click position where the editor can map it (Live Preview renders a
 * callout as one widget, so the cursor may not be on it), falling back to the cursor's line.
 */
function registerContextMenu({ plugin, store, settingTab }: EditorFeatureHost): void {
	let lastClick: { x: number; y: number; time: number } | null = null;
	plugin.registerDomEvent(
		activeDocument,
		'contextmenu',
		(event: MouseEvent) => {
			lastClick = { x: event.clientX, y: event.clientY, time: Date.now() };
		},
		true,
	);

	const clickedLine = (editor: Editor): number => {
		const cm = (editor as Editor & { cm?: { posAtCoords?: (coords: { x: number; y: number }) => number | null } }).cm;
		if (lastClick && Date.now() - lastClick.time < 750 && cm?.posAtCoords) {
			const offset = cm.posAtCoords({ x: lastClick.x, y: lastClick.y });
			if (offset !== null && offset !== undefined) return editor.offsetToPos(offset).line;
		}
		return editor.getCursor().line;
	};

	plugin.registerEvent(
		plugin.app.workspace.on('editor-menu', (menu: Menu, editor: Editor) => {
			const lines = linesOf(editor);
			const block = findCalloutAt(lines, clickedLine(editor));
			if (!block) return;

			menu.addSeparator();
			menu.addItem((item) =>
				item
					.setTitle('Copy callout Markdown')
					.setIcon('lucide-copy')
					.onClick(() => {
						void navigator.clipboard.writeText(calloutMarkdown(lines, block)).then(() => new Notice('Copied the callout.'));
					}),
			);

			const folds: Array<{ fold: FoldState; title: string }> = [
				{ fold: '', title: 'Make callout not foldable' },
				{ fold: '+', title: 'Make callout foldable, open' },
				{ fold: '-', title: 'Make callout foldable, closed' },
			];
			for (const { fold, title } of folds.filter((f) => f.fold !== block.fold)) {
				menu.addItem((item) =>
					item
						.setTitle(title)
						.setIcon('lucide-chevrons-up-down')
						.onClick(() => applyEdit(editor, planFold(lines, block, fold))),
				);
			}

			menu.addItem((item) =>
				item
					.setTitle('Unwrap callout')
					.setIcon('lucide-square-dashed')
					.onClick(() => applyEdit(editor, planUnwrap(lines, block))),
			);

			menu.addItem((item) =>
				item
					.setTitle(store.hasCallout(block.id) ? `Edit "${block.id}" style` : `Create "${block.id}" callout`)
					.setIcon('lucide-palette')
					.onClick(() => {
						if (!store.hasCallout(block.id)) {
							try {
								store.createCustomCallout(block.id);
							} catch (error) {
								new Notice(error instanceof Error ? error.message : String(error));
								return;
							}
						}
						settingTab.openWithPane(new ManageCalloutsPane(store, { query: block.id }));
					}),
			);
		}),
	);
}
