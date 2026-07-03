import { ButtonComponent } from 'obsidian';

import { Callout } from '&callout';
import { CalloutSettings } from '&callout-settings';
import { CalloutReader } from '../../callout-store';
import { UIPaneNavigation } from '&ui/pane';
import { Appearance, ComplexAppearance, UnifiedAppearance } from '../../callout-appearance';
import { CalloutColorSetting } from '&ui/setting/callout-color';
import { CalloutIconSetting } from '&ui/setting/callout-icon';

type AppearanceEditorImpl = {
	toSettings(): CalloutSettings;
	render(
		container: HTMLElement,
		callout: Callout,
		getNav: () => UIPaneNavigation,
		store: CalloutReader,
		onSet: (appearance: Appearance) => void,
	): void;
};

function makeUnifiedEditor(appearance: UnifiedAppearance): AppearanceEditorImpl {
	return {
		toSettings() {
			const { otherChanges, color } = appearance;
			const changes = { ...otherChanges, color };
			if (color === undefined) {
				delete changes.color;
			}
			return Object.keys(changes).length === 0 ? [] : [{ changes }];
		},
		render(container, callout, getNav, store, onSet) {
			const { color, otherChanges } = appearance;
			new CalloutColorSetting(container, callout)
				.setName('Color')
				.setDesc('Change the color of the callout.')
				.setColorString(color)
				.onChange((color) => onSet({ type: 'unified', otherChanges, color }));
			new CalloutIconSetting(container, callout, store, getNav)
				.setName('Icon')
				.setDesc('Change the callout icon.')
				.setIcon(otherChanges.icon)
				.onChange((icon) => onSet({ type: 'unified', color, otherChanges: { ...otherChanges, icon } }));
		},
	};
}

function makeComplexEditor(appearance: ComplexAppearance): AppearanceEditorImpl {
	return {
		toSettings() {
			return appearance.settings;
		},
		render(container, _callout, _getNav, _store, onSet) {
			const { settings } = appearance;
			const complexJson = JSON.stringify(settings, undefined, '  ');
			container.createEl('p', {
				text:
					"This callout has been configured using the plugin's data.json file. " +
					'To prevent unintentional changes to the configuration, you need to edit it manually.',
			});
			container.createEl('code', { cls: 'calloutmanager-edit-callout-appearance-json' }, (el) => {
				el.createEl('pre', { text: complexJson });
			});
			container.createEl('p', {
				text: 'Alternatively, you can reset the callout by clicking the button below twice.',
			});
			let resetButtonClicked = false;
			const resetButton = new ButtonComponent(container)
				.setButtonText('Reset callout')
				.setClass('calloutmanager-edit-callout-appearance-reset')
				.setWarning()
				.onClick(() => {
					if (!resetButtonClicked) {
						resetButtonClicked = true;
						resetButton.setButtonText('Are you sure?');
						return;
					}
					onSet({ type: 'unified', color: undefined, otherChanges: {} });
				});
		},
	};
}

export function makeAppearanceEditor(appearance: Appearance): AppearanceEditorImpl {
	switch (appearance.type) {
		case 'unified':
			return makeUnifiedEditor(appearance);
		case 'complex':
			return makeComplexEditor(appearance);
	}
}
