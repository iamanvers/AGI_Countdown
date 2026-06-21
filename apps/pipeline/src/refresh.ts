import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { runRefresh } from "./pipeline.js";
import type { RefreshScope } from "./types.js";

const defaultNow = "2026-01-01T00:00:00.000Z";
const defaultOutDir = fileURLToPath(new URL("../../web/public/data", import.meta.url));

type CliOptions = {
  cadence: RefreshScope;
  now: Date;
  outDir: string;
};

export async function main(argv = process.argv.slice(2)): Promise<void> {
  const options = parseArgs(argv);
  const result = await runRefresh(options);

  console.log(
    [
      `AGI Countdown refresh scaffold complete`,
      `runId=${result.manifest.runId}`,
      `cadence=${result.manifest.requestedCadence}`,
      `samples=${result.samples.length}`,
      `sources=${result.sourceStatuses.length}`,
      `outDir=${options.outDir}`,
    ].join("\n"),
  );
}

function parseArgs(argv: string[]): CliOptions {
  const values = new Map<string, string>();

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === undefined) {
      continue;
    }

    if (arg === "--") {
      continue;
    }

    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected positional argument "${arg}".`);
    }

    const key = arg.slice(2);
    const next = argv[index + 1];

    if (next === undefined || next.startsWith("--")) {
      throw new Error(`Missing value for --${key}.`);
    }

    values.set(key, next);
    index += 1;
  }

  const cadence = parseCadence(
    values.get("cadence") ?? process.env.PIPELINE_CADENCE ?? "all",
  );
  const now = parseNow(values.get("now") ?? process.env.PIPELINE_NOW ?? defaultNow);
  const outDir = resolve(
    values.get("out-dir") ?? process.env.PIPELINE_OUT_DIR ?? defaultOutDir,
  );

  return {
    cadence,
    now,
    outDir,
  };
}

function parseCadence(value: string): RefreshScope {
  if (
    value === "hourly" ||
    value === "daily" ||
    value === "weekly" ||
    value === "monthly" ||
    value === "all"
  ) {
    return value;
  }

  throw new Error(
    `Invalid cadence "${value}". Expected hourly, daily, weekly, monthly, or all.`,
  );
}

function parseNow(value: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.valueOf())) {
    throw new Error(`Invalid ISO timestamp "${value}".`);
  }

  return date;
}

const entryPath = process.argv[1];

if (entryPath !== undefined && import.meta.url === pathToFileURL(entryPath).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
