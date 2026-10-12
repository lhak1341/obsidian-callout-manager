import type { SearchResult } from 'obsidian';

export class Events {
	private handlers: Record<string, Array<(...args: unknown[]) => void>> = {};
	on(name: string, callback: (...args: unknown[]) => void) {
		(this.handlers[name] ??= []).push(callback);
		return {};
	}
	off(name: string, callback: (...args: unknown[]) => void) {
		this.handlers[name] = (this.handlers[name] ?? []).filter((c) => c !== callback);
	}
	trigger(name: string, ...args: unknown[]) {
		for (const callback of [...(this.handlers[name] ?? [])]) callback(...args);
	}
}

export function prepareFuzzySearch(query: string): (text: string) => SearchResult | null {
	return (text) => {
		// TODO: A real fuzzy search mock.
		if (text.includes(query)) {
			return { score: text.length / query.length, matches: [] };
		}

		return null;
	};
}
