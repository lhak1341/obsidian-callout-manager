import { TextComponent } from 'obsidian';

import { ValiditySet } from './validity-set';

const CALLOUT_ID_PATTERN = /^[a-z][a-z0-9-]*$/;

export function isValidCalloutId(id: string): boolean {
	return CALLOUT_ID_PATTERN.test(id);
}

export function makeTextComponentValidateCalloutID(cmp: TextComponent, id: string, vs: ValiditySet): void {
	cmp.then(({ inputEl }) => {
		const update = vs.addSource(id);

		inputEl.setAttribute('pattern', '^[a-z][a-z0-9-]*$');
		inputEl.setAttribute('required', 'required');
		inputEl.addEventListener('change', onChange);
		inputEl.addEventListener('input', onChange);

		update(inputEl.validity.valid);
		function onChange() {
			update(inputEl.validity.valid);
		}
	});
}
