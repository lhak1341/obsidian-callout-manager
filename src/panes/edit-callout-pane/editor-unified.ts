import { CalloutSettings } from '&callout-settings';

import { CalloutColorSetting } from '&ui/setting/callout-color';
import { CalloutIconSetting } from '&ui/setting/callout-icon';

import { AppearanceEditor } from './appearance-editor';
import { UnifiedAppearance } from './appearance-type';

export default class UnifiedAppearanceEditor extends AppearanceEditor<UnifiedAppearance> {
	/** @override */
	public toSettings(): CalloutSettings {
		const { otherChanges, color } = this.appearance;
		const changes = { ...otherChanges, color };

		if (color === undefined) {
			delete changes.color;
		}

		return Object.keys(changes).length === 0 ? [] : [{ changes }];
	}

	public render() {
		const { plugin, containerEl, callout, setAppearance } = this;
		const { color, otherChanges } = this.appearance;

		new CalloutColorSetting(containerEl, callout)
			.setName('Color')
			.setDesc('Change the color of the callout.')
			.setColorString(color)
			.onChange((color) => setAppearance({ type: 'unified', otherChanges, color }));

		new CalloutIconSetting(containerEl, callout, plugin, () => this.nav)
			.setName('Icon')
			.setDesc('Change the callout icon.')
			.setIcon(otherChanges.icon)
			.onChange((icon) => setAppearance({ type: 'unified', color, otherChanges: { ...otherChanges, icon } }));
	}
}
