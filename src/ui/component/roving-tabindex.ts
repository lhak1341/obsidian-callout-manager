/**
 * How arrow-key navigation activates the newly-focused element.
 *
 * - `auto`: arrow keys both move focus and activate immediately (radio-group style).
 * - `manual`: arrow keys only move focus; Enter/Space activate (listbox/grid style).
 */
export type RovingTabindexActivation = 'auto' | 'manual';

export interface RovingTabindexOptions {
	activation: RovingTabindexActivation;
	onActivate: (index: number) => void;
}

export interface RovingTabindexHandle {
	/**
	 * Moves the roving tabstop to `index` without moving focus.
	 * For elements that persist across renders (e.g. a fixed button row) — call this from
	 * the caller's own activation logic to keep tabindex in sync after `onActivate` fires.
	 */
	setActive(index: number): void;
}

/**
 * Wires up roving-tabindex keyboard navigation (WAI-ARIA single-tab-stop pattern) over a
 * fixed list of elements: only the active element carries `tabindex="0"`, the rest `"-1"`,
 * and arrow keys move both focus and the tabstop with wrap-around.
 *
 * Call this once per render. For elements that get recreated every render (a rebuilt grid),
 * a fresh call is all that's needed — old listeners go away with the old elements. For
 * elements that persist across renders (a fixed button row), keep the returned handle and
 * call `setActive()` to update the tabstop after `onActivate` changes state elsewhere.
 */
export function attachRovingTabindex(
	elements: HTMLElement[],
	activeIndex: number,
	{ activation, onActivate }: RovingTabindexOptions,
): RovingTabindexHandle {
	const setActive = (index: number) => {
		elements.forEach((el, i) => {
			el.tabIndex = i === index ? 0 : -1;
		});
	};
	setActive(activeIndex);

	elements.forEach((el, i) => {
		el.addEventListener('keydown', (e: KeyboardEvent) => {
			if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
				e.preventDefault();
				const next = (i + 1) % elements.length;
				setActive(next);
				if (activation === 'auto') onActivate(next);
				elements[next].focus();
			} else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
				e.preventDefault();
				const prev = (i - 1 + elements.length) % elements.length;
				setActive(prev);
				if (activation === 'auto') onActivate(prev);
				elements[prev].focus();
			} else if (activation === 'manual' && (e.key === 'Enter' || e.key === ' ')) {
				e.preventDefault();
				onActivate(i);
			}
		});
	});

	return { setActive };
}
