import { setIcon } from 'obsidian';

import { resolveLucideIconId } from './lucide-icons';

/**
 * Re-injects icons for callouts where Obsidian's own callout post-processor skipped them.
 *
 * Obsidian's callout post-processor runs on elements while they are still detached from the
 * DOM, so `getComputedStyle` returns empty values and icon injection silently no-ops. This
 * affects contexts like the community plugin info page. A `MutationObserver` fires after
 * insertion, at which point the CSS cascade is live and the correct `--callout-icon` value is
 * available.
 *
 * Popout note windows are separate `Window`/`Document` instances — a `MutationObserver` on the
 * main document never sees mutations there, so each window (main + every popout) needs its own
 * observer. Call {@link attach} as windows open and {@link detach} as they close; the initial
 * (main) window is attached automatically at construction.
 */
export class IconReinjector {
	private readonly observersByWindow = new Map<Window, MutationObserver>();

	public constructor() {
		this.attach(window);
	}

	public attach(win: Window): void {
		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				for (const node of mutation.addedNodes) {
					if (node.instanceOf(HTMLElement)) this.injectMissingCalloutIcons(node);
				}
			}
		});
		observer.observe(win.document.body, { childList: true, subtree: true });
		this.observersByWindow.set(win, observer);
	}

	public detach(win: Window): void {
		this.observersByWindow.get(win)?.disconnect();
		this.observersByWindow.delete(win);
	}

	/** Disconnects every observer across every window. Call from the plugin's unload. */
	public unload(): void {
		for (const observer of this.observersByWindow.values()) observer.disconnect();
		this.observersByWindow.clear();
	}

	private injectMissingCalloutIcons(root: HTMLElement): void {
		const callouts: HTMLElement[] = root.classList.contains('callout') ? [root] : [];
		callouts.push(...root.querySelectorAll<HTMLElement>('.callout'));
		for (const callout of callouts) {
			const iconEl = callout.querySelector<HTMLElement>('.callout-icon');
			if (!iconEl || iconEl.childElementCount > 0) continue;
			const icon = getComputedStyle(callout).getPropertyValue('--callout-icon').trim();
			if (icon) setIcon(iconEl, resolveLucideIconId(icon));
		}
	}
}
