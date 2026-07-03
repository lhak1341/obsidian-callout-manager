import { TextComponent } from 'obsidian';

import { ValiditySet } from './validity-set';

export function makeTextComponentValidateCalloutID(cmp: TextComponent, id: string, vs: ValiditySet): void {
	cmp.then(({ inputEl }) => {
		const update = vs.addSource(id);

		inputEl.setAttribute('pattern', '^[a-z\\-]{1,}$');
		inputEl.setAttribute('required', 'required');
		inputEl.addEventListener('change', onChange);
		inputEl.addEventListener('input', onChange);

		update(inputEl.validity.valid);
		function onChange() {
			update(inputEl.validity.valid);
		}
	});
}
