import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type SourceStatus = {
  sourceId: string;
  name: string;
  url: string;
  lastFetchedAt: string;
  status: "ok" | "stale" | "failed" | "reference";
  errorRate: number;
  domain?: string;
  cadence?: string;
  notes?: string;
  tier?: "primary" | "secondary" | "tertiary";
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

export type JobsSector = {
  sector: string;
  workforceSharePct: number;
  automationExposurePct: number;
  revenueAtRiskPct: number;
  source: string;
  sourceId?: string;
  emergingRoles: Array<{ title: string; demandSignal: number }>;
  decliningRoles: string[];
};

export type JobsRegion = {
  region: string;
  automationExposurePct: number;
  revenueAtRiskPct: number;
  note: string;
  source: string;
  sourceId?: string;
};

export type JobsImpact = {
  ts: string;
  overallAutomationPct: number;
  revenueAtRisk: {
    annualValueUsdTn: number;
    exposedRevenueSharePct: number;
    description: string;
    source: string;
    sourceId?: string;
  };
  regions: JobsRegion[];
  sectors: JobsSector[];
  highlights: Array<{
    title: string;
    description: string;
    demandSignal: number;
    source: string;
    sourceId?: string;
  }>;
};

export type RunStatus = {
  runId: string;
  startedAt: string;
  finishedAt: string;
  cadence: string;
  domainsRun: string[];
  sourcesOk: number;
  sourcesFailed: number;
  quarantinedSamples: number;
  deltaMonths: number;
  bandWidthDays: number;
  status: "ok" | "degraded" | "failed";
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

export type EstimatePoint = {
  ts: string;
  definition: "weak-agi" | "transformative-ai" | "strong-agi";
  tAgi: string;
  progress: number;
  runId?: string;
  deltaMonths?: number;
  band?: { earlyP10: string; lateP90: string };
};

export async function readEstimateHistory() {
  return readJson<EstimatePoint[]>("estimate_history.json");
}

export type NewsItem = {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  orgs: string[];
};

export async function readNews() {
  return readJson<NewsItem[]>("news.json").catch(() => [] as NewsItem[]);
}

export async function readJobs() {
  return readJson<JobsImpact>("jobs.json");
}

export type EngineStateFile = {
  definition: "weak-agi" | "transformative-ai" | "strong-agi";
  tAgi: string;
  progress: number;
  anchor: string;
  deltaMonths: number;
  band: { earlyP10: string; lateP90: string };
};

export async function readEngineState(definition: EngineStateFile["definition"]) {
  return readJson<EngineStateFile>(`engine_state.${definition}.json`);
}

export async function readStatus() {
  return readJson<RunStatus>("status.json");
}

export type MethodologyFactor = {
  id: string;
  label: string;
  category: "internal" | "external";
  domain: string;
  description: string;
  sign: 1 | -1;
  weight: number;
  normalization: string;
  reading:
    | {
        normalized: number;
        level?: number;
        confidence: number;
        citation: string;
        rolling?: {
          applied: boolean;
          method: string;
          sampleSize: number;
          zScore: number;
          percentile: number;
          volatility: number;
        } | null;
      }
    | null;
  contributionMonths: Record<string, number>;
  sources: Array<{ id: string; name: string; url: string }>;
};

export type Methodology = {
  ts: string;
  smoothingAlpha: number;
  formula: string;
  definitions: Array<{
    id: string;
    name: string;
    maxShiftMonths: number;
    progressScale: number;
    anchorBlend: Array<{ bucket: string; label: string; median: string; weight: number; citation: string }>;
  }>;
  factors: MethodologyFactor[];
};

export async function readMethodology() {
  return readJson<Methodology>("methodology.json");
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
