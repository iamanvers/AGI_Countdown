import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

export async function writeJsonFile(
  outDir: string,
  fileName: string,
  value: unknown,
): Promise<string> {
  await mkdir(outDir, { recursive: true });
  const filePath = join(outDir, fileName);
  await writeFile(`${filePath}.tmp`, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(`${filePath}.tmp`, filePath);
  return filePath;
}

export async function readJsonFile<T>(
  outDir: string,
  fileName: string,
  fallback: T,
): Promise<T> {
  try {
    const text = await readFile(join(outDir, fileName), "utf8");
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}
