import { Setting, SliderComponent } from 'obsidian';

import { ICON_COLOR_ADJUST_LIMITS, IconColorAdjustStore } from '../../callout-store';

/**
 * Renders the light-mode and dark-mode "header color" sliders (global saturation/lightness offset
 * applied to every callout header). Each slider change is saved immediately; the reset button
 * zeroes both. Touches only the {@link IconColorAdjustStore}, so it can be mounted once and left
 * alone while the callout list around it re-renders.
 */
export function renderIconColorAdjustSection(containerEl: HTMLElement, store: IconColorAdjustStore): void {
	const groupEl = containerEl.createDiv('setting-group').createDiv('setting-items');
	renderScheme(groupEl, store, 'light', 'Light mode');
	renderScheme(groupEl, store, 'dark', 'Dark mode');
}

function renderScheme(
	containerEl: HTMLElement,
	store: IconColorAdjustStore,
	scheme: 'light' | 'dark',
	label: string,
): void {
	const adjust = store.getIconColorAdjust(scheme);
	const limits = ICON_COLOR_ADJUST_LIMITS;

	let satSlider: SliderComponent;
	let lightSlider: SliderComponent;

	new Setting(containerEl)
		.setName(`${label} header color`)
		.setHeading()
		.then(({ settingEl }) => settingEl.classList.add('calloutmanager-adjust-heading'))
		.addExtraButton((btn) =>
			btn
				.setIcon('lucide-rotate-ccw')
				.setTooltip('Reset to 0')
				.onClick(() => {
					adjust.saturation = 0;
					adjust.lightness = 0;
					store.setIconColorAdjust(scheme, { ...adjust });
					satSlider.setValue(0);
					lightSlider.setValue(0);
				}),
		);

	new Setting(containerEl)
		.setName('Saturation')
		.setDesc(`Shift every callout header's (icon + title text) color saturation in ${label.toLowerCase()}.`)
		.addSlider((slider) => {
			satSlider = slider;
			slider
				.setLimits(limits.saturation.min, limits.saturation.max, limits.saturation.step)
				.setValue(adjust.saturation)
				.setDynamicTooltip()
				.onChange((value) => {
					adjust.saturation = value;
					store.setIconColorAdjust(scheme, { ...adjust });
				});
		});

	new Setting(containerEl)
		.setName('Lightness')
		.setDesc(`Shift every callout header's (icon + title text) color lightness in ${label.toLowerCase()}.`)
		.addSlider((slider) => {
			lightSlider = slider;
			slider
				.setLimits(limits.lightness.min, limits.lightness.max, limits.lightness.step)
				.setValue(adjust.lightness)
				.setDynamicTooltip()
				.onChange((value) => {
					adjust.lightness = value;
					store.setIconColorAdjust(scheme, { ...adjust });
				});
		});
}

declare const STYLES: `
	/* Obsidian's .setting-item-heading has no left/right padding by default (it's meant to sit
	   flush against its container); match the 20px inset of the sibling slider rows it's grouped
	   with here so the heading text and reset button aren't flush against the card edge. */
	/* Bottom padding is trimmed (vs. the 20px on every other side) because the sibling row right
	   below already contributes its own 20px top padding — full 20px here would double that gap. */
	.calloutmanager-adjust-heading.setting-item-heading {
		padding: var(--size-4-5) var(--size-4-5) var(--size-4-1);

		.setting-item-name {
			font-size: var(--font-ui-medium);
			font-weight: var(--font-bold);
		}
	}
`;
