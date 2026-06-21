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
  curatedFactorSeedsBySource,
  curatedForecastAnchors,
  curatedJobs,
  curatedTimeline,
  fetchLiveNews,
  findConnector,
  liveConnectors,
  type FactorSample,
  type NewsItem,
} from "@agi-countdown/sources";
import { basename } from "node:path";
import { readJsonFile, writeJsonFile } from "./file-store.js";
import type { RefreshManifest, RefreshScope, SourceRunStatus } from "./types.js";

const allCadences: readonly RefreshCadence[] = ["hourly", "daily", "weekly", "monthly"];
const HISTORY_LIMIT = 4000;
const FORECAST_FACTOR_ID = "forecast-consensus-anchor";
// EWMA weight on the newest reading; lower = smoother / more robust to jitter.
const SMOOTHING_ALPHA = 0.5;
const LIVE_PARSERS = new Set(liveConnectors.map((connector) => connector.parser));

/** A source produces a numeric factor sample (live connector or curated seed). */
function isSignalSource(source: SourceDef): boolean {
  return LIVE_PARSERS.has(source.parser) || curatedFactorSeedsBySource[source.id] !== undefined;
}

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
  const selectedSources = sourceRegistry.filter(
    (source) => isSignalSource(source) && dueCadences.includes(source.cadence),
  );
  const runId = createRunId(options.cadence, generatedAt);

  const sourceResults = await Promise.all(
    selectedSources.map((source) => fetchSource(source, options)),
  );
  const sourceStatuses = sourceResults.map((result) => result.status);
  const rawSamples = sourceResults.flatMap((result) => result.samples).sort(compareSamples);
  const freshSamples = validateSamples(rawSamples);
  const freshQuarantined = freshSamples.filter((sample) => sample.quarantined).length;

  // Carry forward the last-known value of every factor that wasn't refreshed
  // this run, so a partial-cadence run (e.g. hourly) never wipes the date or
  // the progress meter. Slower factors keep their most recent observation.
  const carriedFactors = await readJsonFile<PublicFactorSnapshot[]>(
    options.outDir,
    "factors.json",
    [],
  );
  const samples = mergeWithCarriedFactors(freshSamples, carriedFactors);

  // EWMA-smooth each factor against its previously published value so the date
  // moves smoothly instead of jumping with every noisy live reading.
  const aggregates = smoothAggregates(
    aggregateByFactor(samples),
    aggregateByFactor(carriedFactors.map(snapshotToSample)),
  );
  const marketOptimism = aggregates.get(FORECAST_FACTOR_ID)?.normalized;
  const engineStates = agiDefinitions.map((definition) =>
    computeEngineState(
      buildEngineInput(definition.id, generatedAt, runId, aggregates, marketOptimism),
    ),
  );

  const carriedSources = await readJsonFile<PublicSourceStatus[]>(
    options.outDir,
    "sources.json",
    [],
  );

  // Live, genuinely-current AI news (with frontier-lab tagging). Falls back to
  // the previously published feed if the source is unavailable.
  const liveNews = await fetchLiveNews(options.now);
  const news =
    liveNews.length > 0
      ? liveNews
      : await readJsonFile<NewsItem[]>(options.outDir, "news.json", []);

  const outputFiles = await writeStaticDataArtifacts(options.outDir, {
    generatedAt,
    runId,
    requestedCadence: options.cadence,
    sourceStatuses,
    carriedSources,
    samples,
    engineStates,
    freshQuarantined,
    news,
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
      const emphasisMap = definition.domainEmphasis as
        | Partial<Record<string, number>>
        | undefined;
      const emphasis = emphasisMap?.[factor.domain] ?? 1;
      return [
        {
          factorId: factor.id,
          normalized: centerNormalized(factor, aggregate.normalized),
          sign: factor.sign,
          weight: factor.weight * emphasis,
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
    sourceStatuses: SourceRunStatus[];
    carriedSources: readonly PublicSourceStatus[];
    samples: FactorSample[];
    engineStates: EngineState[];
    freshQuarantined: number;
    news: NewsItem[];
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
  const publicSources = createPublicSourceStatuses(
    artifacts.sourceStatuses,
    artifacts.carriedSources,
  );
  const runStatus = createPublicRunStatus(artifacts);
  const curatedEvents = curatedTimeline.map((event) => ({
    ...event,
    id: slugify(event.title),
    curatedBy: "curated" as const,
  }));
  const derivedEvents = deriveMilestones(artifacts.news);
  const timeline = dedupeTimeline([...derivedEvents, ...curatedEvents]);
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
    writeJsonFile(outDir, "news.json", artifacts.news),
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

/**
 * Build the public health record for every source in the registry. Sources that
 * ran this tick get fresh status; the rest carry their last-known status so the
 * Sources page stays complete after a partial-cadence run.
 */
function createPublicSourceStatuses(
  sourceStatuses: readonly SourceRunStatus[],
  carriedSources: readonly PublicSourceStatus[],
): PublicSourceStatus[] {
  const ranById = new Map(sourceStatuses.map((status) => [status.sourceId, status]));
  const carriedById = new Map(carriedSources.map((source) => [source.sourceId, source]));

  return (sourceRegistry as readonly SourceDef[]).map((source) => {
    // Reference-catalog sources are attributed but not fetched.
    if (!isSignalSource(source)) {
      return {
        sourceId: source.id,
        name: source.name,
        url: source.url,
        lastFetchedAt: new Date(0).toISOString(),
        status: "reference" as const,
        errorRate: 0,
        domain: source.domain,
        cadence: source.cadence,
        notes: source.tosNotes,
        tier: source.tier ?? "tertiary",
      };
    }

    const status = ranById.get(source.id);
    if (status !== undefined) {
      const publicStatus =
        status.status === "ok" ? "ok" : status.status === "failed" ? "failed" : "stale";
      return {
        sourceId: source.id,
        name: source.name,
        url: source.url,
        lastFetchedAt: status.fetchedAt,
        status: publicStatus,
        errorRate: status.status === "failed" ? 1 : 0,
        domain: source.domain,
        cadence: source.cadence,
        notes: status.warnings.join(" ") || source.tosNotes,
        tier: source.tier ?? "primary",
      };
    }

    const carried = carriedById.get(source.id);
    return {
      sourceId: source.id,
      name: source.name,
      url: source.url,
      lastFetchedAt: carried?.lastFetchedAt ?? new Date(0).toISOString(),
      status: carried?.status === "reference" ? "stale" : carried?.status ?? "stale",
      errorRate: carried?.errorRate ?? 0,
      domain: source.domain,
      cadence: source.cadence,
      notes: carried?.notes ?? source.tosNotes,
      tier: source.tier ?? "primary",
    };
  });
}

function createPublicRunStatus(artifacts: {
  runId: string;
  generatedAt: string;
  requestedCadence: RefreshScope;
  sourceStatuses: readonly SourceRunStatus[];
  freshQuarantined: number;
  engineStates: EngineState[];
}): PublicRunStatus {
  const sourcesOk = artifacts.sourceStatuses.filter((source) => source.status === "ok").length;
  const sourcesFailed = artifacts.sourceStatuses.filter((source) => source.status === "failed").length;
  return {
    runId: artifacts.runId,
    startedAt: artifacts.generatedAt,
    finishedAt: artifacts.generatedAt,
    cadence:
      artifacts.requestedCadence === "monthly" || artifacts.requestedCadence === "all"
        ? "weekly"
        : artifacts.requestedCadence,
    domainsRun: Array.from(
      new Set(
        artifacts.sourceStatuses
          .map((status) => sourceRegistry.find((source) => source.id === status.sourceId)?.domain)
          .filter((domain): domain is NonNullable<typeof domain> => domain !== undefined),
      ),
    ).sort(),
    sourcesOk,
    sourcesFailed,
    quarantinedSamples: artifacts.freshQuarantined,
    deltaMonths: averageDefined(artifacts.engineStates.map((state) => state.deltaMonths)),
    bandWidthDays: averageDefined(artifacts.engineStates.map((state) => bandWidthDays(state))),
    status: sourcesFailed > 0 || artifacts.freshQuarantined > 0 ? "degraded" : "ok",
  };
}

/**
 * Merge this run's fresh samples with the last-published factor snapshots,
 * keeping the freshest value per (factor, source). Carried-over samples retain
 * their original observation time so the UI can show how stale each value is.
 */
function mergeWithCarriedFactors(
  fresh: FactorSample[],
  carried: readonly PublicFactorSnapshot[],
): FactorSample[] {
  const freshKeys = new Set(fresh.map((sample) => `${sample.factorId}:${sample.sourceId}`));
  const carriedSamples = carried
    .filter((snapshot) => !freshKeys.has(`${snapshot.factorId}:${snapshot.sourceId}`))
    .map(snapshotToSample);
  return [...fresh, ...carriedSamples].sort(compareSamples);
}

function snapshotToSample(snapshot: PublicFactorSnapshot): FactorSample {
  return {
    factorId: snapshot.factorId,
    sourceId: snapshot.sourceId,
    observedAt: snapshot.ts,
    collectedAt: snapshot.ts,
    raw: snapshot.raw,
    unit: snapshot.unit ?? "",
    normalized: snapshot.normalized,
    confidence: snapshot.confidence,
    citation: snapshot.citation,
    quarantined: snapshot.quarantined,
    notes: snapshot.notes,
  };
}

/**
 * EWMA-smooth each current factor aggregate toward its previously published
 * value. Robustness measure: a single noisy live reading can only move a factor
 * part-way, so the projected date glides instead of jumping.
 */
function smoothAggregates(
  current: Map<string, FactorAggregate>,
  previous: Map<string, FactorAggregate>,
): Map<string, FactorAggregate> {
  const smoothed = new Map<string, FactorAggregate>();
  for (const [factorId, aggregate] of current) {
    const prior = previous.get(factorId);
    const normalized =
      prior === undefined
        ? aggregate.normalized
        : SMOOTHING_ALPHA * aggregate.normalized + (1 - SMOOTHING_ALPHA) * prior.normalized;
    smoothed.set(factorId, { ...aggregate, normalized });
  }
  return smoothed;
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

type DerivedEvent = {
  date: string;
  title: string;
  summary: string;
  significance: "minor" | "major" | "landmark";
  category: string;
  citation: string;
  curatedBy: "curated" | "feed";
  id: string;
};

const RELEASE_RE = /\b(launch|launches|launched|releas|unveil|announce|introduc|debut|ships?|rolls? out)\b/i;
const MODEL_RE = /\b(gpt-?\d|gpt|claude|gemini|llama|grok|deepseek|qwen|mistral|fable|model|agi|frontier|reasoning|o\d|sora|superintelligence)\b/i;

/**
 * Auto-derive recent major-milestone candidates from the live news feed:
 * org-tagged stories using release/launch language about a model or AGI. Keeps
 * the "Major milestones" section current (incl. the present year) deterministically.
 */
function deriveMilestones(news: NewsItem[]): DerivedEvent[] {
  return news
    .filter(
      (item) =>
        item.orgs.length > 0 && (RELEASE_RE.test(item.title) || MODEL_RE.test(item.title)),
    )
    .slice(0, 6)
    .map((item) => ({
      date: item.publishedAt.slice(0, 10),
      title: item.title,
      summary: `${item.orgs.join(", ")} — surfaced from ${item.source}.`,
      significance: "major" as const,
      category: "model-release",
      citation: item.url,
      curatedBy: "feed" as const,
      id: slugify(item.title),
    }));
}

function dedupeTimeline(events: DerivedEvent[]): DerivedEvent[] {
  const seen = new Set<string>();
  const out: DerivedEvent[] = [];
  for (const event of events) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    out.push(event);
  }
  return out;
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
  status: "ok" | "stale" | "failed" | "reference";
  errorRate: number;
  domain?: string;
  cadence?: RefreshCadence;
  notes?: string;
  tier?: "primary" | "secondary" | "tertiary";
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
