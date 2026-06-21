import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type SourceStatus = {
  sourceId: string;
  name: string;
  url: string;
  lastFetchedAt: string;
  status: "ok" | "stale" | "failed";
  errorRate: number;
  domain?: string;
  cadence?: string;
  notes?: string;
};

export type TimelineEvent = {
  id?: string;
  date: string;
  title: string;
  summary: string;
  significance: "minor" | "major" | "landmark";
  category: string;
  citation: string;
  curatedBy: "curated" | "feed";
};

export type FactorSnapshot = {
  factorId: string;
  sourceId: string;
  ts: string;
  raw: number | string;
  normalized: number;
  confidence: number;
  citation: string;
  quarantined: boolean;
  factorName?: string;
  domain?: string;
  unit?: string;
  notes?: string;
};

const dataDir = join(process.cwd(), "public", "data");

export async function readSources() {
  return readJson<SourceStatus[]>("sources.json");
}

export async function readTimeline() {
  return readJson<TimelineEvent[]>("timeline.json");
}

export async function readFactors() {
  return readJson<FactorSnapshot[]>("factors.json");
}

async function readJson<T>(fileName: string): Promise<T> {
  const text = await readFile(join(dataDir, fileName), "utf8");
  return JSON.parse(text) as T;
}

export function groupBy<T>(items: T[], getKey: (item: T) => string | undefined) {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    const key = getKey(item) ?? "other";
    groups[key] = [...(groups[key] ?? []), item];
    return groups;
  }, {});
}

export function formatDateOnly(isoDate: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(isoDate));
}
