import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { staticDataSchemas } from "../packages/validate/dist/index.js";

const dataDir = join(process.cwd(), "apps", "web", "public", "data");

let validated = 0;
const errors = [];

for (const [file, schema] of Object.entries(staticDataSchemas)) {
  try {
    const text = await readFile(join(dataDir, file), "utf8");
    schema.parse(JSON.parse(text));
    validated += 1;
  } catch (error) {
    errors.push(`${file}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (errors.length > 0) {
  console.error(`Validation failed for ${errors.length} file(s):\n${errors.join("\n\n")}`);
  process.exit(1);
}

console.log(`Validated ${validated} data files against zod schemas.`);
