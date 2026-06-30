import { ColorComponent, DropdownComponent, ExtraButtonComponent, Setting } from 'obsidian';

import { Callout } from '&callout';
import { getColorFromCallout } from '&callout-util';
import { RGB, parseColorRGB } from '&color';

import { ResetButtonComponent } from '&ui/component/reset-button';

import { defaultColors } from '../../default_colors.json';

/**
 * An Obsidian {@link Setting} for picking the color of a callout.
 */
export class CalloutColorSetting extends Setting {
	private readonly callout: Callout;
	private colorComponent!: ColorComponent;
	private dropdownComponent!: DropdownComponent;
	private resetComponent!: ExtraButtonComponent;

	private isDefault: boolean;
	private cssVarColor: string | undefined;
	private onChanged: ((value: string | undefined) => void) | undefined;

	public constructor(containerEl: HTMLElement, callout: Callout) {
		super(containerEl);
		this.onChanged = undefined;
		this.callout = callout;
		this.isDefault = true;
		this.cssVarColor = undefined;

		// Create the color picker.
		this.addColorPicker((picker) => {
			this.colorComponent = picker;
			picker.onChange(() => {
				if (this.cssVarColor !== undefined) return; // ignore picker when CSS var is active
				const { r, g, b } = this.getColor();
				this.onChanged?.(`${r}, ${g}, ${b}`);
			});
		});

		this.dropdownComponent = new DropdownComponent(this.controlEl).then((dropdown) => {
			dropdown.addOptions(defaultColors);
			dropdown.onChange((value: string) => {
				this.isDefault = false;
				if (value === '') {
					// "Custom color..." selected — switch to picker mode
					this.cssVarColor = undefined;
					const { r, g, b } = this.getColor();
					this.resetComponent.setDisabled(false).setTooltip('Reset Color');
					this.onChanged?.(`${r}, ${g}, ${b}`);
				} else {
					// CSS variable selected — emit directly
					this.cssVarColor = value;
					this.resetComponent.setDisabled(false).setTooltip('Reset Color');
					this.onChanged?.(value);
				}
			});
		});

		this.components.push(this.dropdownComponent);

		this.components.push(
			new ResetButtonComponent(this.controlEl).then((btn) => {
				this.resetComponent = btn;
				btn.onClick(() => this.onChanged?.(undefined));
			}),
		);

		this.setColor(undefined);
	}

	/**
	 * Sets the color string.
	 * Accepts a CSS variable reference (e.g. `var(--color-blue)`), a comma-delimited
	 * RGB value (e.g. `255, 10, 25`), or undefined to reset to the callout default.
	 *
	 * @param color The color string or undefined to reset.
	 * @returns `this`, for chaining.
	 */
	public setColorString(color: string | undefined): typeof this {
		if (color == null) {
			return this.setColor(undefined);
		}

		// CSS variable reference — show in dropdown, color picker shows the default as a hint
		if (color.startsWith('var(')) {
			this.isDefault = false;
			this.cssVarColor = color;
			const isKnown = Object.prototype.hasOwnProperty.call(defaultColors, color);
			this.dropdownComponent.setValue(isKnown ? color : '');
			this.resetComponent.setDisabled(false).setTooltip('Reset Color');
			const fallback = getColorFromCallout(this.callout) ?? { r: 0, g: 0, b: 0 };
			this.colorComponent.setValueRgb(fallback);
			return this;
		}

		// Legacy comma-delimited RGB
		this.cssVarColor = undefined;
		return this.setColor(parseColorRGB(`rgb(${color})`) ?? { r: 0, g: 0, b: 0 });
	}

	/**
	 * Sets the color.
	 *
	 * @param color The color or undefined to reset the color to default.
	 * @returns `this`, for chaining.
	 */
	public setColor(color: RGB | undefined): typeof this {
		const isDefault = (this.isDefault = color == null);
		this.cssVarColor = undefined;
		if (color == null) {
			color = getColorFromCallout(this.callout) ?? { r: 0, g: 0, b: 0 };
		}

		if (color instanceof Array) {
			color = { r: color[0], g: color[1], b: color[2] };
		}

		this.colorComponent.setValueRgb(color);
		this.dropdownComponent.setValue('');
		this.resetComponent.setDisabled(isDefault).setTooltip(isDefault ? '' : 'Reset Color');

		return this;
	}

	public getColor(): RGB {
		return this.colorComponent.getValueRgb();
	}

	public isDefaultColor(): boolean {
		return this.isDefault;
	}

	public onChange(cb: (value: string | undefined) => void): typeof this {
		this.onChanged = cb;
		return this;
	}
}
