import {
  agiDefinitions,
  factorRegistry,
  sourceRegistry,
  type FactorDef,
  type RefreshCadence,
  type SourceDef,
} from "@agi-countdown/config";
import {
  addMonthsToIso,
  computeEngineState,
  type EngineInput,
  type EngineState,
} from "@agi-countdown/engine";
import {
  findConnector,
  type FactorSample,
  type SourceConnector,
} from "@agi-countdown/sources";
import { basename } from "node:path";
import { readJsonFile, writeJsonFile } from "./file-store.js";
import type {
  EngineBoundaryInput,
  RefreshManifest,
  RefreshScope,
  SourceRunStatus,
} from "./types.js";

const allCadences: readonly RefreshCadence[] = [
  "hourly",
  "daily",
  "weekly",
  "monthly",
];

export type RefreshOptions = {
  cadence: RefreshScope;
  now: Date;
  outDir: string;
};

export type RefreshResult = {
  manifest: RefreshManifest;
  sourceStatuses: SourceRunStatus[];
  samples: FactorSample[];
  engineInput: EngineBoundaryInput;
};

export async function runRefresh(
  options: RefreshOptions,
): Promise<RefreshResult> {
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
  const samples = sourceResults
    .flatMap((result) => result.samples)
    .sort(compareSamples);
  const acceptedSamples = validateSamples(samples);
  const engineInput = createEngineBoundaryInput(
    runId,
    generatedAt,
    selectedSources,
    acceptedSamples,
  );

  const staticDataFiles = await writeStaticDataArtifacts(options.outDir, {
    runId,
    generatedAt,
    requestedCadence: options.cadence,
    selectedSources,
    sourceStatuses,
    samples: acceptedSamples,
  });

  const manifest: RefreshManifest = {
    schemaVersion: 1,
    runId,
    generatedAt,
    requestedCadence: options.cadence,
    dueCadences,
    outputFiles: staticDataFiles.map((filePath) => basename(filePath)),
    notes: [
      "This scaffold writes the public static JSON contract consumed by apps/web.",
      "Only fixture connectors execute by default; unimplemented source parsers are reported as skipped.",
    ],
  };

  return {
    manifest,
    sourceStatuses,
    samples: acceptedSamples,
    engineInput,
  };
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
  const fetchedAt = options.now.toISOString();

  if (connector === undefined) {
    return {
      status: {
        sourceId: source.id,
        name: source.name,
        parser: source.parser,
        cadence: source.cadence,
        status: "skipped",
        fetchedAt,
        sampleCount: 0,
        warnings: [`No connector registered for parser "${source.parser}".`],
      },
      samples: [],
    };
  }

  try {
    const result = await connector.fetch(source, {
      now: options.now,
      cadence: options.cadence,
    });

    return {
      status: {
        sourceId: source.id,
        name: source.name,
        parser: source.parser,
        cadence: source.cadence,
        status: "ok",
        fetchedAt: result.fetchedAt,
        sampleCount: result.samples.length,
        warnings: result.warnings,
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
  const factorIds: ReadonlySet<string> = new Set(
    factorRegistry.map((factor) => factor.id),
  );
  const sourceIds: ReadonlySet<string> = new Set(
    sourceRegistry.map((source) => source.id),
  );

  return samples
    .map((sample) => {
      const warnings: string[] = [];

      if (!factorIds.has(sample.factorId)) {
        warnings.push(`Unknown factor id "${sample.factorId}".`);
      }

      if (!sourceIds.has(sample.sourceId)) {
        warnings.push(`Unknown source id "${sample.sourceId}".`);
      }

      if (sample.citation.trim().length === 0) {
        warnings.push("Missing citation.");
      }

      if (sample.confidence < 0 || sample.confidence > 1) {
        warnings.push("Confidence must be in the 0..1 range.");
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

function createEngineBoundaryInput(
  runId: string,
  generatedAt: string,
  selectedSources: readonly SourceDef[],
  samples: readonly FactorSample[],
): EngineBoundaryInput {
  const samplesByFactor = new Map<string, FactorSample[]>();

  for (const sample of samples) {
    const factorSamples = samplesByFactor.get(sample.factorId) ?? [];
    factorSamples.push(sample);
    samplesByFactor.set(sample.factorId, factorSamples);
  }

  return {
    schemaVersion: 1,
    runId,
    generatedAt,
    boundary: {
      status: "waiting-for-engine-and-shared",
      expectedEnginePackage: "@agi-countdown/engine",
      expectedSharedPackage: "@agi-countdown/shared",
    },
    definitions: agiDefinitions,
    factors: factorRegistry.map((factor: FactorDef) => ({
      factor,
      samples: (samplesByFactor.get(factor.id) ?? []).sort(compareSamples),
    })),
    sources: selectedSources,
  };
}

async function writeStaticDataArtifacts(
  outDir: string,
  artifacts: {
    runId: string;
    generatedAt: string;
    requestedCadence: RefreshScope;
    selectedSources: readonly SourceDef[];
    sourceStatuses: SourceRunStatus[];
    samples: FactorSample[];
  },
): Promise<string[]> {
  const engineStates = createEngineStates(artifacts);
  const previousHistory = await readJsonFile<EstimatePoint[]>(
    outDir,
    "estimate_history.json",
    [],
  );
  const nextHistory = [
    ...previousHistory,
    ...engineStates.map((state) => ({
      ts: state.ts,
      definition: state.definition,
      tAgi: state.tAgi,
      progress: state.progress,
      runId: state.runId,
      deltaMonths: state.deltaMonths,
      band: state.band,
    })),
  ];
  const publicFactors = createPublicFactorSnapshots(artifacts.samples);
  const publicSources = createPublicSourceStatuses(
    artifacts.selectedSources,
    artifacts.sourceStatuses,
  );
  const runStatus = createPublicRunStatus(
    artifacts,
    engineStates,
    publicSources,
    publicFactors,
  );

  return Promise.all([
    ...engineStates.map((state) =>
      writeJsonFile(outDir, `engine_state.${state.definition}.json`, state),
    ),
    writeJsonFile(outDir, "estimate_history.json", nextHistory),
    writeJsonFile(outDir, "factors.json", publicFactors),
    writeJsonFile(outDir, "sources.json", publicSources),
    writeJsonFile(outDir, "status.json", runStatus),
  ]);
}

function createEngineStates(artifacts: {
  runId: string;
  generatedAt: string;
  samples: FactorSample[];
}): EngineState[] {
  return agiDefinitions.map((definition) => {
    const maxShiftMonths = definition.maxShiftMonths;
    const input: EngineInput = {
      runId: `${artifacts.runId}-${definition.id}`,
      ts: artifacts.generatedAt,
      definition: definition.id,
      anchor: {
        date: definition.baselineAnchorIso,
        earlyP10: addMonthsToIso(definition.baselineAnchorIso, -maxShiftMonths),
        lateP90: addMonthsToIso(definition.baselineAnchorIso, maxShiftMonths),
      },
      factors: artifacts.samples.flatMap((sample) => {
        const factor = factorRegistry.find((entry) => entry.id === sample.factorId);

        if (factor === undefined) {
          return [];
        }

        return [
          {
            factorId: factor.id,
            normalized: readSampleNormalized(sample),
            sign: factor.sign,
            weight: factor.weight,
            confidence: sample.confidence,
            citation: publicCitation(sample.citation, sample.factorId),
            rationale: createMoverRationale(factor, sample),
            quarantined: sample.quarantined,
          },
        ];
      }),
      progress: {
        benchmarkSaturation: latestNormalized(
          artifacts.samples,
          "frontier-benchmark-saturation",
        ),
        computeVsRequired: latestNormalized(
          artifacts.samples,
          "training-compute-growth",
        ),
        economicDeployment: averageDefined([
          latestNormalized(artifacts.samples, "adoption-usage"),
          latestNormalized(artifacts.samples, "labor-automation-exposure"),
        ]),
        weights: definition.progressWeights,
      },
      maxShiftMonths,
      confidence: {
        factorVolatilityMultiplier: 1.1,
        minimumBandMonths: Math.max(6, maxShiftMonths / 6),
      },
      rates: {
        computePerSec: 7.8e18,
        papersPerDay: 184,
        investUsdPerSec: 4280,
      },
    };

    return computeEngineState(input);
  });
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
      citation: publicCitation(sample.citation, sample.factorId),
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
  const statusesById = new Map(sourceStatuses.map((status) => [status.sourceId, status]));

  return selectedSources.map((source) => {
    const status = statusesById.get(source.id);
    const publicStatus =
      status?.status === "ok" ? "ok" : status?.status === "failed" ? "failed" : "stale";

    return {
      sourceId: source.id,
      name: source.name,
      url: publicSourceUrl(source),
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
  },
  engineStates: readonly EngineState[],
  publicSources: readonly PublicSourceStatus[],
  publicFactors: readonly PublicFactorSnapshot[],
): PublicRunStatus {
  const failedSources = publicSources.filter((source) => source.status === "failed").length;
  const quarantinedSamples = publicFactors.filter((factor) => factor.quarantined).length;

  return {
    runId: artifacts.runId,
    startedAt: artifacts.generatedAt,
    finishedAt: artifacts.generatedAt,
    cadence: artifacts.requestedCadence === "monthly" || artifacts.requestedCadence === "all"
      ? "weekly"
      : artifacts.requestedCadence,
    domainsRun: Array.from(new Set(artifacts.selectedSources.map((source) => source.domain))).sort(),
    sourcesOk: publicSources.filter((source) => source.status === "ok").length,
    sourcesFailed: failedSources,
    quarantinedSamples,
    deltaMonths: averageDefined(engineStates.map((state) => state.deltaMonths)),
    bandWidthDays: averageDefined(engineStates.map((state) => bandWidthDays(state))),
    status: failedSources > 0 || quarantinedSamples > 0 ? "degraded" : "ok",
  };
}

function readSampleNormalized(sample: FactorSample): number {
  if (sample.normalized !== undefined) {
    return sample.normalized;
  }

  return typeof sample.raw === "number" ? sample.raw : 0;
}

function latestNormalized(samples: readonly FactorSample[], factorId: string): number {
  const sample = [...samples]
    .filter((entry) => entry.factorId === factorId && !entry.quarantined)
    .sort((left, right) => right.observedAt.localeCompare(left.observedAt))[0];

  return sample === undefined ? 0 : clamp(readSampleNormalized(sample), 0, 1);
}

function averageDefined(values: readonly number[]): number {
  const finiteValues = values.filter((value) => Number.isFinite(value));

  if (finiteValues.length === 0) {
    return 0;
  }

  return finiteValues.reduce((sum, value) => sum + value, 0) / finiteValues.length;
}

function createMoverRationale(factor: FactorDef, sample: FactorSample): string {
  const direction = factor.sign === 1 ? "accelerator" : "decelerator";
  return `${factor.label} registered ${readSampleNormalized(sample).toFixed(2)} as a ${direction} signal.`;
}

function publicCitation(citation: string, fallbackId: string): string {
  if (citation.startsWith("https://") || citation.startsWith("http://")) {
    return citation;
  }

  return `https://example.com/agi-countdown/fixtures/${fallbackId}`;
}

function publicSourceUrl(source: SourceDef): string {
  if (source.url.startsWith("https://") || source.url.startsWith("http://")) {
    return source.url;
  }

  return `https://example.com/agi-countdown/sources/${source.id}`;
}

function bandWidthDays(state: EngineState): number {
  const early = Date.parse(state.band.earlyP10);
  const late = Date.parse(state.band.lateP90);

  if (!Number.isFinite(early) || !Number.isFinite(late)) {
    return 0;
  }

  return Math.max(0, (late - early) / (24 * 60 * 60 * 1000));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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

export function registeredConnectorParsers(): string[] {
  return [findConnector("fixture")]
    .filter((connector): connector is SourceConnector => connector !== undefined)
    .map((connector) => connector.parser);
}

type EstimatePoint = {
  ts: string;
  definition: string;
  tAgi: string;
  progress: number;
  runId?: string;
  deltaMonths?: number;
  band?: {
    earlyP10: string;
    lateP90: string;
  };
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
