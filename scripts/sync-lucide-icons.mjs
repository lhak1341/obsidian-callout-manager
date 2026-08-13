// Regenerates src/lucide-icon-svgs.json (the full offline Lucide icon set
// this plugin bundles) and src/lucide-icon-tags.json (lucide-static's
// per-icon search synonyms, e.g. "flask-conical" -> ["lab", "chemistry",
// "experiment", ...] — same data lucide.dev's own icon search runs on) from
// the lucide-static devDependency. Bump lucide-static in package.json first
// (bun update lucide-static), then run this to pick up whatever that
// version ships.
import { readdirSync, readFileSync, writeFileSync } from "fs";

const ICONS_DIR = "node_modules/lucide-static/icons";
const TAGS_FILE = "node_modules/lucide-static/tags.json";

// lucide-static ships each icon pretty-printed with a license comment and a
// "lucide lucide-<name>" class — neither is used by scaleToCustomIconViewport
// (lucide-icons.ts only reads viewBox/fill/stroke off the root element), so
// both are stripped here rather than shipping ~2000 copies of them.
function compact(svgText) {
	return svgText
		.replace(/<!--.*?-->/s, "")
		.replace(/\s+class="[^"]*"/, "")
		.replace(/\s+/g, " ")
		.trim();
}

const files = readdirSync(ICONS_DIR).filter((name) => name.endsWith(".svg"));
const svgs = {};
for (const file of files.sort()) {
	const name = file.slice(0, -".svg".length);
	svgs[name] = compact(readFileSync(`${ICONS_DIR}/${file}`, "utf8"));
}

writeFileSync("src/lucide-icon-svgs.json", JSON.stringify(svgs) + "\n");
console.log(`Wrote ${Object.keys(svgs).length} icons to src/lucide-icon-svgs.json`);

// Filtered to icons actually bundled above — tags.json's icon set can drift
// from icon-nodes.json's (aliases, renames) since they're separate files.
const allTags = JSON.parse(readFileSync(TAGS_FILE, "utf8"));
const tags = Object.fromEntries(Object.entries(allTags).filter(([name]) => name in svgs));

writeFileSync("src/lucide-icon-tags.json", JSON.stringify(tags) + "\n");
console.log(`Wrote tags for ${Object.keys(tags).length} icons to src/lucide-icon-tags.json`);
