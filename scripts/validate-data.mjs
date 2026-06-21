import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const dataDir = join(root, "apps", "web", "public", "data");
const files = [
  "engine_state.weak-agi.json",
  "engine_state.transformative-ai.json",
  "engine_state.strong-agi.json",
  "estimate_history.json",
  "factors.json",
  "timeline.json",
  "jobs.json",
  "sources.json",
  "status.json"
];

for (const file of files) {
  const text = await readFile(join(dataDir, file), "utf8");
  JSON.parse(text);
}

console.log(`Validated ${files.length} data files.`);
