import { describe, expect, test } from '@jest/globals';

import { assembleStylesheet } from './assemble-stylesheet';

const env = { theme: 'DefaultTheme', colorScheme: 'dark' as const };

describe('assembleStylesheet', () => {
	test('empty settings produces only the defaults block', () => {
		const css = assembleStylesheet({}, {}, env);
		// Default colour selectors always present (single-quoted by the defaults block)
		expect(css).toContain("[data-callout='note']");
		expect(css).toContain("[data-callout='warning']");
		// No user-generated rules
		expect(css).not.toContain('[data-callout="');
	});

	test('user setting for a callout appears in output', () => {
		const css = assembleStylesheet({ 'my-callout': [{ changes: { color: '0, 128, 255' } }] }, {}, env);
		expect(css).toContain('[data-callout="my-callout"]');
		expect(css).toContain('--callout-color: rgb(0, 128, 255)');
	});

	test('alias inherits canonical settings', () => {
		const css = assembleStylesheet(
			{ canonical: [{ changes: { color: '100, 200, 50' } }] },
			{ canonical: ['alias-a', 'alias-b'] },
			env,
		);
		expect(css).toContain('[data-callout="alias-a"]');
		expect(css).toContain('[data-callout="alias-b"]');
		const aliasRules = css.match(/\[data-callout="alias-a"\][^}]*}/s)?.[0] ?? '';
		expect(aliasRules).toContain('--callout-color: rgb(100, 200, 50)');
	});

	test('alias own setting wins over propagated canonical setting in CSS cascade', () => {
		const css = assembleStylesheet(
			{
				canonical: [{ changes: { color: '100, 200, 50' } }],
				alias: [{ changes: { color: '255, 0, 0' } }],
			},
			{ canonical: ['alias'] },
			env,
		);
		// Propagated canonical color appears first (in alias propagation section)
		const propagatedIdx = css.indexOf('100, 200, 50');
		// Alias's own override appears after it — wins in the cascade
		const overrideIdx = css.indexOf('255, 0, 0');
		expect(propagatedIdx).toBeGreaterThan(-1);
		expect(overrideIdx).toBeGreaterThan(propagatedIdx);
	});

	test('no alias propagation when canonical has no settings', () => {
		const css = assembleStylesheet({}, { canonical: ['alias-a'] }, env);
		expect(css).not.toContain('[data-callout="alias-a"]');
	});

	test('no alias propagation when aliases list is empty', () => {
		const css = assembleStylesheet({ canonical: [{ changes: { color: '100, 200, 50' } }] }, { canonical: [] }, env);
		// The canonical's own rule is present exactly once
		const matches = css.match(/\[data-callout="canonical"\]/g) ?? [];
		expect(matches).toHaveLength(1);
	});

	test('defaults block always comes before alias propagation and user overrides', () => {
		const css = assembleStylesheet(
			{ canonical: [{ changes: { color: '0, 0, 0' } }] },
			{ canonical: ['alias'] },
			env,
		);
		const defaultsEnd = css.indexOf('--callout-color: var(--callout-quote)'); // last rule in defaults block
		const firstUserRule = css.indexOf('[data-callout="');
		expect(defaultsEnd).toBeGreaterThan(-1);
		expect(firstUserRule).toBeGreaterThan(defaultsEnd);
	});
});

describe('assembleStylesheet — iconColorAdjust', () => {
	test('omitted iconColorAdjust produces no adjust block', () => {
		const css = assembleStylesheet({}, {}, env);
		expect(css).not.toContain('.callout-title');
	});

	test('zero saturation and lightness for the active scheme produces no adjust block', () => {
		const css = assembleStylesheet({}, {}, env, {
			light: { saturation: 0, lightness: 0 },
			dark: { saturation: 0, lightness: 0 },
		});
		expect(css).not.toContain('.callout-title');
	});

	test('nonzero saturation alone still emits the block, with a zero lightness offset', () => {
		const css = assembleStylesheet({}, {}, env, {
			light: { saturation: 0, lightness: 0 },
			dark: { saturation: 20, lightness: 0 },
		});
		expect(css).toContain('calc(s + 20)');
		expect(css).toContain('calc(l + 0)');
	});

	test('nonzero lightness alone still emits the block, with a zero saturation offset', () => {
		const css = assembleStylesheet({}, {}, env, {
			light: { saturation: 0, lightness: 0 },
			dark: { saturation: 0, lightness: 15 },
		});
		expect(css).toContain('calc(s + 0)');
		expect(css).toContain('calc(l + 15)');
	});

	test('negative offsets interpolate as a literal unary minus', () => {
		const css = assembleStylesheet({}, {}, env, {
			light: { saturation: 0, lightness: 0 },
			dark: { saturation: -30, lightness: -10 },
		});
		expect(css).toContain('calc(s + -30)');
		expect(css).toContain('calc(l + -10)');
	});

	test('offsets past the UI\'s slider bounds are clamped, not passed through raw', () => {
		const css = assembleStylesheet({}, {}, env, {
			light: { saturation: 0, lightness: 0 },
			dark: { saturation: 1000, lightness: 500 },
		});
		expect(css).toContain('calc(s + 100)');
		expect(css).toContain('calc(l + 50)');
	});

	test('negative offsets past the UI\'s slider bounds are clamped symmetrically', () => {
		const css = assembleStylesheet({}, {}, env, {
			light: { saturation: 0, lightness: 0 },
			dark: { saturation: -1000, lightness: -500 },
		});
		expect(css).toContain('calc(s + -100)');
		expect(css).toContain('calc(l + -50)');
	});

	test('offsets stay unitless — % silently breaks Chromium\'s relative-color calc()', () => {
		const css = assembleStylesheet({}, {}, env, {
			light: { saturation: 0, lightness: 0 },
			dark: { saturation: 30, lightness: 30 },
		});
		expect(css).not.toMatch(/calc\([sl] \+ -?\d+%\)/);
	});

	test('matches Obsidian\'s two-class icon selector exactly, not the bare .callout-icon', () => {
		const css = assembleStylesheet({}, {}, env, {
			light: { saturation: 0, lightness: 0 },
			dark: { saturation: 20, lightness: 0 },
		});
		expect(css).toContain('.callout-title, .callout-icon .svg-icon {');
	});

	test('env.colorScheme selects the matching scheme\'s offsets only', () => {
		const iconColorAdjust = {
			light: { saturation: 10, lightness: 5 },
			dark: { saturation: 90, lightness: 40 },
		};

		const lightCSS = assembleStylesheet({}, {}, { ...env, colorScheme: 'light' }, iconColorAdjust);
		expect(lightCSS).toContain('calc(s + 10)');
		expect(lightCSS).not.toContain('calc(s + 90)');

		const darkCSS = assembleStylesheet({}, {}, { ...env, colorScheme: 'dark' }, iconColorAdjust);
		expect(darkCSS).toContain('calc(s + 90)');
		expect(darkCSS).not.toContain('calc(s + 10)');
	});
});
