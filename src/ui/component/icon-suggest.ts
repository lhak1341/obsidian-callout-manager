import { AbstractInputSuggest, App, setIcon } from 'obsidian';

import { rankIconSuggestions } from '../../icon-search';
import { allLucideIconNames, getLucideIconTags, resolveLucideIconId } from '../../lucide-icons';

// Obsidian's icon resolver accepts both "lucide-cake" and the bare "cake" for
// built-in Lucide icons. This plugin already stores/displays icon ids bare
// everywhere (see the "icon…" column in ManageCalloutsPane), so strip the
// prefix for display and for the value written into the input.
const stripLucidePrefix = (id: string) => (id.startsWith('lucide-') ? id.slice('lucide-'.length) : id);

/**
 * Autocomplete for Lucide icon ids, backed by Obsidian's own icon registry.
 *
 * Attach to any bare `<input type="text">` used for an icon name to get a
 * filtered, icon-previewed suggestion list as the user types.
 */
export class IconSuggest extends AbstractInputSuggest<string> {
	private readonly inputEl: HTMLInputElement;

	public constructor(app: App, inputEl: HTMLInputElement) {
		super(app, inputEl);
		this.inputEl = inputEl;
	}

	protected getSuggestions(query: string): string[] {
		return rankIconSuggestions(query, allLucideIconNames(), getLucideIconTags);
	}

	public renderSuggestion(iconId: string, el: HTMLElement): void {
		el.addClass('calloutmanager-icon-suggest-item');
		setIcon(el.createSpan({ cls: 'calloutmanager-icon-suggest-icon' }), resolveLucideIconId(iconId));
		el.createSpan({ text: stripLucidePrefix(iconId) });
	}

	public selectSuggestion(iconId: string): void {
		this.setValue(stripLucidePrefix(iconId));
		this.inputEl.trigger('input');
		this.inputEl.trigger('change');
		this.close();
	}
}

declare const STYLES: `
	.calloutmanager-icon-suggest-item {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.calloutmanager-icon-suggest-icon {
		display: inline-flex;
		align-items: center;
	}
`;
