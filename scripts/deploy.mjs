// Copies build output into the vault's plugin folder.
// Override the plugins directory with OBSIDIAN_VAULT_DIR.
//
// manifest.json is a build artifact here — the esbuild plugin regenerates it from
// package.json's `obsidianPlugin` field on every build.
import { access, copyFile, mkdir } from 'fs/promises';
import { basename, join } from 'path';

const VAULT_DIR =
	process.env.OBSIDIAN_VAULT_DIR ??
	'/Users/lhak/Library/Mobile Documents/iCloud~md~obsidian/Documents/lhakZettel/.obsidian/plugins';

// Vault folder name — not the manifest id.
const PLUGIN_DIR_NAME = 'callout-manager';

const REQUIRED = ['manifest.json', join('dist', 'main.js')];
const OPTIONAL = [join('dist', 'styles.css')];

const targets = [join(VAULT_DIR, PLUGIN_DIR_NAME)];

const exists = (path) => access(path).then(() => true, () => false);

for (const src of REQUIRED) {
	if (!(await exists(src))) {
		throw new Error(`Missing build output: ${src} — run "bun run build:plugin" first.`);
	}
}

for (const target of targets) {
	await mkdir(target, { recursive: true });
	for (const src of [...REQUIRED, ...OPTIONAL]) {
		if (!(await exists(src))) continue;
		await copyFile(src, join(target, basename(src)));
	}
	console.log(`Deployed to ${target}`);
}
