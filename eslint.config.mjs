import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import obsidianmd from "eslint-plugin-obsidianmd";

const tsRecommended = tseslint.configs["recommended"];

export default [
	// Ignore non-source files
	{ ignores: ["dist/**", "node_modules/**", "build/**", "utils/**", "scripts/**", "*.mjs", "*.cjs", "src/**/*.test.ts", "src/test-util.ts"] },

	// TypeScript source files
	{
		files: ["src/**/*.ts"],
		languageOptions: {
			parser: tsparser,
			parserOptions: {
				project: "./tsconfig.json",
			},
		},
		plugins: {
			"@typescript-eslint": tseslint,
			obsidianmd: obsidianmd.default ?? obsidianmd,
		},
		rules: {
			// Carry over from original .eslintrc
			...tsRecommended.rules,
			"no-mixed-spaces-and-tabs": "off",
			"no-prototype-builtins": "off",
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": ["error", { args: "none", varsIgnorePattern: "STYLES" }],
			"@typescript-eslint/ban-ts-comment": "off",
			"@typescript-eslint/no-empty-function": "off",
			"@typescript-eslint/no-namespace": "off",
			"@typescript-eslint/no-explicit-any": "off",

			// obsidianmd recommended rules
			"obsidianmd/commands/no-command-in-command-id": "error",
			"obsidianmd/commands/no-command-in-command-name": "error",
			"obsidianmd/commands/no-default-hotkeys": "error",
			"obsidianmd/commands/no-plugin-id-in-command-id": "error",
			"obsidianmd/commands/no-plugin-name-in-command-name": "error",
			"obsidianmd/settings-tab/no-manual-html-headings": "error",
			"obsidianmd/settings-tab/no-problematic-settings-headings": "error",
			"obsidianmd/vault/iterate": "error",
			"obsidianmd/detach-leaves": "error",
			"obsidianmd/editor-drop-paste": "error",
			"obsidianmd/hardcoded-config-path": "error",
			"obsidianmd/no-forbidden-elements": "error",
			"obsidianmd/no-global-this": "error",
			"obsidianmd/no-plugin-as-component": "error",
			"obsidianmd/no-sample-code": "error",
			"obsidianmd/no-tfile-tfolder-cast": "error",
			"obsidianmd/no-static-styles-assignment": "error",
			"obsidianmd/object-assign": "error",
			"obsidianmd/platform": "error",
			"obsidianmd/prefer-get-language": "error",
			"obsidianmd/prefer-abstract-input-suggest": "error",
			"obsidianmd/prefer-window-timers": "error",
			"obsidianmd/prefer-active-doc": "warn",
			"obsidianmd/regex-lookbehind": "error",
			"obsidianmd/sample-names": "error",
			"obsidianmd/validate-manifest": "error",
			"obsidianmd/validate-license": "error",
			"obsidianmd/ui/sentence-case": ["error", { enforceCamelCaseLower: true, allowAutoFix: true }],
			"obsidianmd/no-view-references-in-plugin": "error",
			"obsidianmd/no-unsupported-api": "error",
			"obsidianmd/prefer-file-manager-trash-file": "warn",
			"obsidianmd/prefer-instanceof": "error",
		},
	},
];
