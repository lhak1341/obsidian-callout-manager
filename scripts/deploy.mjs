import { copyFile, mkdir } from 'fs/promises';
import { join } from 'path';

const VAULT_PLUGIN_DIR =
	process.env.OBSIDIAN_VAULT_PLUGIN_DIR ??
	'/Users/lhak/Library/Mobile Documents/iCloud~md~obsidian/Documents/lhakZettel/.obsidian/plugins/callout-manager';

const FILES = ['manifest.json', join('dist', 'main.js'), join('dist', 'styles.css')];

await mkdir(VAULT_PLUGIN_DIR, { recursive: true });

for (const src of FILES) {
	const dest = join(VAULT_PLUGIN_DIR, src.split('/').at(-1));
	await copyFile(src, dest);
	console.log(`Copied ${src} → ${dest}`);
}

console.log('Deploy complete.');
