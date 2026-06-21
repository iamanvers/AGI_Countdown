import {
  agiDefinitions,
  factorRegistry,
  sourceRegistry,
  type AgiDefinitionId,
  type FactorDef,
  type RefreshCadence,
  type SourceDef,
} from "@agi-countdown/config";
import {
  addMonthsToIso,
  computeEngineState,
  type AnchorSourceInput,
  type EngineInput,
  type EngineState,
  type FactorInput,
} from "@agi-countdown/engine";
import {
  curatedConnector,
  curatedForecastAnchors,
  curatedJobs,
  curatedTimeline,
  findConnector,
  type FactorSample,
} from "@agi-countdown/sources";
import { basename } from "node:path";
import { readJsonFile, writeJsonFile } from "./file-store.js";
import type { RefreshManifest, RefreshScope, SourceRunStatus } from "./types.js";

const allCadences: readonly RefreshCadence[] = ["hourly", "daily", "weekly", "monthly"];
const HISTORY_LIMIT = 4000;
const FORECAST_FACTOR_ID = "forecast-consensus-anchor";

export type RefreshOptions = {
  cadence: RefreshScope;
  now: Date;
  outDir: string;
};

export type RefreshResult = {
  manifest: RefreshManifest;
  sourceStatuses: SourceRunStatus[];
  samples: FactorSample[];
  engineStates: EngineState[];
};

export async function runRefresh(options: RefreshOptions): Promise<RefreshResult> {
  const generatedAt = options.now.toISOString();
  const dueCadences = resolveDueCadences(options.cadence);
  const selectedSources = sourceRegistry.filter((source) =>
    dueCadences.includes(source.cadence),
  );
  const runId = createRunId(options.cadence, generatedAt);

  const sourceResults = await Promise.all(
    selectedSources.map((source) => fetchSource(source, options)),
  );
  const sourceStatuses = sourceResults.map((result) => result.status);
  const rawSamples = sourceResults.flatMap((result) => result.samples).sort(compareSamples);
  const samples = validateSamples(rawSamples);

  const aggregates = aggregateByFactor(samples);
  const marketOptimism = aggregates.get(FORECAST_FACTOR_ID)?.normalized;
  const engineStates = agiDefinitions.map((definition) =>
    computeEngineState(
      buildEngineInput(definition.id, generatedAt, runId, aggregates, marketOptimism),
    ),
  );

  const outputFiles = await writeStaticDataArtifacts(options.outDir, {
    generatedAt,
    runId,
    requestedCadence: options.cadence,
    selectedSources,
    sourceStatuses,
    samples,
    engineStates,
  });

  const manifest: RefreshManifest = {
    schemaVersion: 1,
    runId,
    generatedAt,
    requestedCadence: options.cadence,
    dueCadences,
    outputFiles: outputFiles.map((filePath) => basename(filePath)),
    notes: [
      "Live connectors: Manifold, arXiv, GDELT. All other sources use cited curated values.",
      "Date is computed deterministically from a forecast-blended anchor plus bounded live factors.",
    ],
  };

  return { manifest, sourceStatuses, samples, engineStates };
}

function resolveDueCadences(cadence: RefreshScope): RefreshCadence[] {
  if (cadence === "all") {
    return [...allCadences];
  }
  if (cadence === "weekly") {
    return ["weekly", "monthly"];
  }
  return [cadence];
}

async function fetchSource(
  source: SourceDef,
  options: RefreshOptions,
): Promise<{ status: SourceRunStatus; samples: FactorSample[] }> {
  const connector = findConnector(source.parser);
  const context = { now: options.now, cadence: options.cadence };
  const fetchedAt = options.now.toISOString();

  try {
    let result = await connector.fetch(source, context);
    let warnings = [...result.warnings];

    // If a live connector produced nothing (e.g. an API outage or rate limit),
    // fall back to cited curated values for the same source so the factor still
    // contributes a real, attributable signal.
    if (result.samples.length === 0 && connector !== curatedConnector && curatedConnector.supports(source)) {
      const fallback = await curatedConnector.fetch(source, context);
      if (fallback.samples.length > 0) {
        result = fallback;
        warnings = [...warnings, ...fallback.warnings, "Live fetch empty; used curated fallback."];
      }
    }

    const hasData = result.samples.length > 0;

    return {
      status: {
        sourceId: source.id,
        name: source.name,
        parser: source.parser,
        cadence: source.cadence,
        status: hasData ? "ok" : "skipped",
        fetchedAt: result.fetchedAt,
        sampleCount: result.samples.length,
        warnings,
      },
      samples: result.samples,
    };
  } catch (error) {
    return {
      status: {
        sourceId: source.id,
        name: source.name,
        parser: source.parser,
        cadence: source.cadence,
        status: "failed",
        fetchedAt,
        sampleCount: 0,
        warnings: [error instanceof Error ? error.message : String(error)],
      },
      samples: [],
    };
  }
}

function validateSamples(samples: FactorSample[]): FactorSample[] {
  const factorIds = new Set<string>(factorRegistry.map((factor) => factor.id));
  const sourceIds = new Set<string>(sourceRegistry.map((source) => source.id));
  const boundsByFactor = new Map<string, { min?: number; max?: number } | undefined>(
    factorRegistry.map((factor) => [factor.id, factor.bounds]),
  );

  return samples
    .map((sample) => {
      const warnings: string[] = [];
      const normalized = readSampleNormalized(sample);

      if (!factorIds.has(sample.factorId)) {
        warnings.push(`Unknown factor id "${sample.factorId}".`);
      }
      if (!sourceIds.has(sample.sourceId)) {
        warnings.push(`Unknown source id "${sample.sourceId}".`);
      }
      if (!isHttpUrl(sample.citation)) {
        warnings.push("Citation must be an http(s) URL.");
      }
      if (sample.confidence < 0 || sample.confidence > 1) {
        warnings.push("Confidence must be within 0..1.");
      }

      const bounds = boundsByFactor.get(sample.factorId);
      if (bounds?.min !== undefined && normalized < bounds.min - 1e-9) {
        warnings.push(`Normalized value ${normalized} below factor minimum ${bounds.min}.`);
      }
      if (bounds?.max !== undefined && normalized > bounds.max + 1e-9) {
        warnings.push(`Normalized value ${normalized} above factor maximum ${bounds.max}.`);
      }

      if (warnings.length === 0) {
        return sample;
      }

      return {
        ...sample,
        confidence: 0,
        quarantined: true,
        notes: [sample.notes, ...warnings].filter(Boolean).join(" "),
      };
    })
    .sort(compareSamples);
}

type FactorAggregate = {
  factorId: string;
  normalized: number;
  confidence: number;
  citation: string;
  sourceId: string;
};

function aggregateByFactor(samples: FactorSample[]): Map<string, FactorAggregate> {
  const byFactor = new Map<string, FactorSample[]>();
  for (const sample of samples) {
    if (sample.quarantined) {
      continue;
    }
    const list = byFactor.get(sample.factorId) ?? [];
    list.push(sample);
    byFactor.set(sample.factorId, list);
  }

  const aggregates = new Map<string, FactorAggregate>();
  for (const [factorId, list] of byFactor) {
    const totalConfidence = list.reduce((sum, sample) => sum + Math.max(sample.confidence, 1e-6), 0);
    const weightedNormalized =
      list.reduce(
        (sum, sample) => sum + readSampleNormalized(sample) * Math.max(sample.confidence, 1e-6),
        0,
      ) / totalConfidence;
    const best = [...list].sort((a, b) => b.confidence - a.confidence)[0];

    aggregates.set(factorId, {
      factorId,
      normalized: weightedNormalized,
      confidence: totalConfidence / list.length,
      citation: best?.citation ?? "",
      sourceId: best?.sourceId ?? "",
    });
  }

  return aggregates;
}

function buildEngineInput(
  definitionId: AgiDefinitionId,
  generatedAt: string,
  runId: string,
  aggregates: Map<string, FactorAggregate>,
  marketOptimism: number | undefined,
): EngineInput {
  const definition = agiDefinitions.find((entry) => entry.id === definitionId);
  if (definition === undefined) {
    throw new Error(`Unknown definition "${definitionId}".`);
  }

  const factors: FactorInput[] = factorRegistry
    .filter((factor) => factor.id !== FORECAST_FACTOR_ID)
    .flatMap((factor) => {
      const aggregate = aggregates.get(factor.id);
      if (aggregate === undefined) {
        return [];
      }
      return [
        {
          factorId: factor.id,
          normalized: centerNormalized(factor, aggregate.normalized),
          sign: factor.sign,
          weight: factor.weight,
          confidence: aggregate.confidence,
          citation: aggregate.citation,
          rationale: createMoverRationale(factor, aggregate.normalized),
        },
      ];
    });

  return {
    runId: `${runId}-${definition.id}`,
    ts: generatedAt,
    definition: definition.id,
    anchor: { sources: buildAnchorSources(definition.id, definition.forecastWeights, marketOptimism) },
    factors,
    progress: {
      benchmarkSaturation: aggregates.get("frontier-benchmark-saturation")?.normalized ?? 0,
      computeVsRequired: aggregates.get("training-compute-growth")?.normalized ?? 0,
      economicDeployment: averageDefined([
        aggregates.get("adoption-usage")?.normalized,
        aggregates.get("labor-automation-exposure")?.normalized,
      ]),
      weights: definition.progressWeights,
    },
    maxShiftMonths: definition.maxShiftMonths,
    confidence: {
      factorVolatilityMultiplier: 1,
      minimumBandMonths: Math.max(6, definition.maxShiftMonths / 6),
    },
    rates: {
      computePerSec: 8.4e18,
      papersPerDay: 196,
      investUsdPerSec: 4900,
    },
  };
}

/**
 * Factors are normalized 0..1 levels. Center them around 0.5 so a "neutral"
 * reading contributes ~0 to the date, above-neutral accelerates, below-neutral
 * decelerates. Scaled to [-1, 1].
 */
function centerNormalized(factor: FactorDef, normalized: number): number {
  const max = factor.bounds?.max ?? 1;
  const min = factor.bounds?.min ?? 0;
  const span = max - min || 1;
  const unit = (normalized - min) / span; // 0..1
  return clamp((unit - 0.5) * 2, -1, 1);
}

function buildAnchorSources(
  definitionId: AgiDefinitionId,
  forecastWeights: { metaculus: number; markets: number; experts: number; computeModels: number },
  marketOptimism: number | undefined,
): AnchorSourceInput[] {
  const seeds = curatedForecastAnchors[definitionId];
  const optimism = marketOptimism ?? 0.5;
  // Higher market optimism pulls the market anchor sooner (up to ~12 months).
  const marketNudgeMonths = (0.5 - optimism) * 24;

  return seeds.map((seed) => {
    const isMarket = seed.bucket === "markets";
    const median = isMarket ? addMonthsToIso(seed.median, marketNudgeMonths) : seed.median;
    return {
      id: `${definitionId}:${seed.bucket}`,
      median,
      p10: isMarket ? addMonthsToIso(seed.p10, marketNudgeMonths) : seed.p10,
      p90: isMarket ? addMonthsToIso(seed.p90, marketNudgeMonths) : seed.p90,
      weight: forecastWeights[seed.bucket],
    };
  });
}

async function writeStaticDataArtifacts(
  outDir: string,
  artifacts: {
    generatedAt: string;
    runId: string;
    requestedCadence: RefreshScope;
    selectedSources: readonly SourceDef[];
    sourceStatuses: SourceRunStatus[];
    samples: FactorSample[];
    engineStates: EngineState[];
  },
): Promise<string[]> {
  const previousHistory = await readJsonFile<EstimatePoint[]>(outDir, "estimate_history.json", []);
  const nextHistory = [
    ...previousHistory,
    ...artifacts.engineStates.map((state) => ({
      ts: state.ts,
      definition: state.definition,
      tAgi: state.tAgi,
      progress: state.progress,
      runId: state.runId,
      deltaMonths: state.deltaMonths,
      band: state.band,
    })),
  ].slice(-HISTORY_LIMIT);

  const publicFactors = createPublicFactorSnapshots(artifacts.samples);
  const publicSources = createPublicSourceStatuses(artifacts.selectedSources, artifacts.sourceStatuses);
  const runStatus = createPublicRunStatus(artifacts, publicSources, publicFactors);
  const timeline = curatedTimeline.map((event) => ({
    ...event,
    id: slugify(event.title),
    curatedBy: "curated" as const,
  }));
  const jobs = { ts: artifacts.generatedAt, ...curatedJobs };

  return Promise.all([
    ...artifacts.engineStates.map((state) =>
      writeJsonFile(outDir, `engine_state.${state.definition}.json`, state),
    ),
    writeJsonFile(outDir, "estimate_history.json", nextHistory),
    writeJsonFile(outDir, "factors.json", publicFactors),
    writeJsonFile(outDir, "sources.json", publicSources),
    writeJsonFile(outDir, "status.json", runStatus),
    writeJsonFile(outDir, "timeline.json", timeline),
    writeJsonFile(outDir, "jobs.json", jobs),
  ]);
}

function createPublicFactorSnapshots(samples: readonly FactorSample[]): PublicFactorSnapshot[] {
  return samples.map((sample) => {
    const factor = factorRegistry.find((entry) => entry.id === sample.factorId);
    return {
      factorId: sample.factorId,
      sourceId: sample.sourceId,
      ts: sample.observedAt,
      raw: typeof sample.raw === "boolean" ? String(sample.raw) : sample.raw,
      normalized: readSampleNormalized(sample),
      confidence: clamp(sample.confidence, 0, 1),
      citation: sample.citation,
      quarantined: sample.quarantined,
      factorName: factor?.label,
      domain: factor?.domain,
      unit: sample.unit,
      notes: sample.notes,
    };
  });
}

function createPublicSourceStatuses(
  selectedSources: readonly SourceDef[],
  sourceStatuses: readonly SourceRunStatus[],
): PublicSourceStatus[] {
  const byId = new Map(sourceStatuses.map((status) => [status.sourceId, status]));
  return selectedSources.map((source) => {
    const status = byId.get(source.id);
    const publicStatus =
      status?.status === "ok" ? "ok" : status?.status === "failed" ? "failed" : "stale";
    return {
      sourceId: source.id,
      name: source.name,
      url: source.url,
      lastFetchedAt: status?.fetchedAt ?? new Date(0).toISOString(),
      status: publicStatus,
      errorRate: status?.status === "failed" ? 1 : 0,
      domain: source.domain,
      cadence: source.cadence,
      notes: status?.warnings.join(" ") || source.tosNotes,
    };
  });
}

function createPublicRunStatus(
  artifacts: {
    runId: string;
    generatedAt: string;
    requestedCadence: RefreshScope;
    selectedSources: readonly SourceDef[];
    engineStates: EngineState[];
  },
  publicSources: readonly PublicSourceStatus[],
  publicFactors: readonly PublicFactorSnapshot[],
): PublicRunStatus {
  const sourcesFailed = publicSources.filter((source) => source.status === "failed").length;
  const quarantinedSamples = publicFactors.filter((factor) => factor.quarantined).length;
  return {
    runId: artifacts.runId,
    startedAt: artifacts.generatedAt,
    finishedAt: artifacts.generatedAt,
    cadence:
      artifacts.requestedCadence === "monthly" || artifacts.requestedCadence === "all"
        ? "weekly"
        : artifacts.requestedCadence,
    domainsRun: Array.from(new Set(artifacts.selectedSources.map((source) => source.domain))).sort(),
    sourcesOk: publicSources.filter((source) => source.status === "ok").length,
    sourcesFailed,
    quarantinedSamples,
    deltaMonths: averageDefined(artifacts.engineStates.map((state) => state.deltaMonths)),
    bandWidthDays: averageDefined(artifacts.engineStates.map((state) => bandWidthDays(state))),
    status: sourcesFailed > 0 || quarantinedSamples > 0 ? "degraded" : "ok",
  };
}

function readSampleNormalized(sample: FactorSample): number {
  if (sample.normalized !== undefined) {
    return sample.normalized;
  }
  return typeof sample.raw === "number" ? sample.raw : 0;
}

function averageDefined(values: ReadonlyArray<number | undefined>): number {
  const finite = values.filter((value): value is number => Number.isFinite(value));
  if (finite.length === 0) {
    return 0;
  }
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

function createMoverRationale(factor: FactorDef, normalized: number): string {
  const direction = factor.sign === 1 ? "accelerator" : "decelerator";
  return `${factor.label} read ${normalized.toFixed(2)} (a ${direction} signal).`;
}

function bandWidthDays(state: EngineState): number {
  const early = Date.parse(state.band.earlyP10);
  const late = Date.parse(state.band.lateP90);
  if (!Number.isFinite(early) || !Number.isFinite(late)) {
    return 0;
  }
  return Math.max(0, (late - early) / 86_400_000);
}

function isHttpUrl(value: string): boolean {
  return value.startsWith("https://") || value.startsWith("http://");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64);
}

function createRunId(cadence: RefreshScope, generatedAt: string): string {
  return `refresh-${cadence}-${generatedAt.replace(/[^0-9A-Za-z]/g, "")}`;
}

function compareSamples(left: FactorSample, right: FactorSample): number {
  return (
    left.factorId.localeCompare(right.factorId) ||
    left.sourceId.localeCompare(right.sourceId) ||
    left.observedAt.localeCompare(right.observedAt)
  );
}

type EstimatePoint = {
  ts: string;
  definition: string;
  tAgi: string;
  progress: number;
  runId?: string;
  deltaMonths?: number;
  band?: { earlyP10: string; lateP90: string };
};

type PublicFactorSnapshot = {
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

type PublicSourceStatus = {
  sourceId: string;
  name: string;
  url: string;
  lastFetchedAt: string;
  status: "ok" | "stale" | "failed";
  errorRate: number;
  domain?: string;
  cadence?: RefreshCadence;
  notes?: string;
};

type PublicRunStatus = {
  runId: string;
  startedAt: string;
  finishedAt: string;
  cadence: "hourly" | "daily" | "weekly";
  domainsRun: string[];
  sourcesOk: number;
  sourcesFailed: number;
  quarantinedSamples: number;
  deltaMonths: number;
  bandWidthDays: number;
  status: "ok" | "degraded" | "failed";
};
