import { z } from "zod";

export const AGI_DEFINITIONS = ["weak-agi", "transformative-ai", "strong-agi"] as const;
export const CURATION_MODES = ["curated", "feed"] as const;
export const DATA_CADENCES = ["hourly", "daily", "weekly", "monthly"] as const;
export const RUN_CADENCES = ["hourly", "daily", "weekly"] as const;
export const RUN_STATUSES = ["ok", "degraded", "failed"] as const;
export const SOURCE_STATUSES = ["ok", "stale", "failed", "reference"] as const;
export const SOURCE_TIERS = ["primary", "secondary", "tertiary"] as const;
export const TIMELINE_SIGNIFICANCES = ["minor", "major", "landmark"] as const;

export type AgiDefinition = (typeof AGI_DEFINITIONS)[number];

const nonEmptyStringSchema = z.string().trim().min(1);
const isoDateTimeSchema = z.string().datetime({ offset: true });
const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, "Expected YYYY-MM-DD");
const urlSchema = z.string().url();
const percentSchema = z.number().finite().min(0).max(100);
const ratioSchema = z.number().finite().min(0).max(1);

export const agiDefinitionSchema = z.enum(AGI_DEFINITIONS);
export const timelineSignificanceSchema = z.enum(TIMELINE_SIGNIFICANCES);
export const curationModeSchema = z.enum(CURATION_MODES);
export const sourceHealthStatusSchema = z.enum(SOURCE_STATUSES);
export const dataCadenceSchema = z.enum(DATA_CADENCES);
export const runCadenceSchema = z.enum(RUN_CADENCES);
export const runHealthStatusSchema = z.enum(RUN_STATUSES);

export const confidenceBandSchema = z
  .object({
    earlyP10: isoDateTimeSchema,
    lateP90: isoDateTimeSchema,
    likelyEarly: isoDateTimeSchema.optional(),
    likelyLate: isoDateTimeSchema.optional()
  })
  .strict();

export const moverSchema = z
  .object({
    factorId: nonEmptyStringSchema,
    contributionMonths: z.number().finite(),
    rationale: nonEmptyStringSchema,
    citation: urlSchema
  })
  .strict();

export const engineRatesSchema = z
  .object({
    computePerSec: z.number().finite().nonnegative().optional(),
    papersPerDay: z.number().finite().nonnegative().optional(),
    investUsdPerSec: z.number().finite().nonnegative().optional()
  })
  .strict();

export const engineStateSchema = z
  .object({
    runId: nonEmptyStringSchema,
    ts: isoDateTimeSchema,
    definition: agiDefinitionSchema,
    tAgi: isoDateTimeSchema,
    progress: percentSchema,
    band: confidenceBandSchema,
    anchor: isoDateTimeSchema,
    deltaMonths: z.number().finite(),
    movers: z.array(moverSchema),
    rates: engineRatesSchema.optional(),
    stale: z.boolean().optional()
  })
  .strict();

export const estimatePointSchema = z
  .object({
    ts: isoDateTimeSchema,
    definition: agiDefinitionSchema,
    tAgi: isoDateTimeSchema,
    progress: percentSchema,
    runId: nonEmptyStringSchema.optional(),
    deltaMonths: z.number().finite().optional(),
    band: confidenceBandSchema.optional()
  })
  .strict();

export const estimateHistorySchema = z.array(estimatePointSchema);

export const factorSnapshotSchema = z
  .object({
    factorId: nonEmptyStringSchema,
    sourceId: nonEmptyStringSchema,
    ts: isoDateTimeSchema,
    raw: z.union([z.number().finite(), nonEmptyStringSchema]),
    normalized: z.number().finite(),
    confidence: ratioSchema,
    citation: urlSchema,
    quarantined: z.boolean(),
    factorName: nonEmptyStringSchema.optional(),
    domain: nonEmptyStringSchema.optional(),
    momentum: z.number().finite().optional(),
    unit: nonEmptyStringSchema.optional(),
    notes: nonEmptyStringSchema.optional()
  })
  .strict();

export const factorsSchema = z.array(factorSnapshotSchema);

export const timelineEventSchema = z
  .object({
    date: isoDateSchema,
    title: nonEmptyStringSchema,
    summary: nonEmptyStringSchema,
    significance: timelineSignificanceSchema,
    category: nonEmptyStringSchema,
    citation: urlSchema,
    curatedBy: curationModeSchema,
    id: nonEmptyStringSchema.optional()
  })
  .strict();

export const timelineSchema = z.array(timelineEventSchema);

export const jobsImpactSchema = z
  .object({
    ts: isoDateTimeSchema,
    overallAutomationPct: percentSchema,
    revenueAtRisk: z
      .object({
        annualValueUsdTn: z.number().finite().nonnegative(),
        exposedRevenueSharePct: percentSchema,
        description: nonEmptyStringSchema,
        source: urlSchema,
        sourceId: nonEmptyStringSchema.optional()
      })
      .strict(),
    regions: z.array(
      z
        .object({
          region: nonEmptyStringSchema,
          automationExposurePct: percentSchema,
          revenueAtRiskPct: percentSchema,
          note: nonEmptyStringSchema,
          source: urlSchema,
          sourceId: nonEmptyStringSchema.optional()
        })
        .strict()
    ),
    sectors: z.array(
      z
        .object({
          sector: nonEmptyStringSchema,
          workforceSharePct: percentSchema,
          automationExposurePct: percentSchema,
          revenueAtRiskPct: percentSchema,
          source: urlSchema,
          sourceId: nonEmptyStringSchema.optional(),
          emergingRoles: z.array(
            z
              .object({
                title: nonEmptyStringSchema,
                demandSignal: ratioSchema
              })
              .strict()
          ),
          decliningRoles: z.array(nonEmptyStringSchema)
        })
        .strict()
    ),
    highlights: z.array(
      z
        .object({
          title: nonEmptyStringSchema,
          description: nonEmptyStringSchema,
          demandSignal: ratioSchema,
          source: urlSchema,
          sourceId: nonEmptyStringSchema.optional()
        })
        .strict()
    )
  })
  .strict();

export const sourceStatusSchema = z
  .object({
    sourceId: nonEmptyStringSchema,
    name: nonEmptyStringSchema,
    url: urlSchema,
    lastFetchedAt: isoDateTimeSchema,
    status: sourceHealthStatusSchema,
    errorRate: ratioSchema,
    domain: nonEmptyStringSchema.optional(),
    cadence: dataCadenceSchema.optional(),
    notes: nonEmptyStringSchema.optional(),
    tier: z.enum(SOURCE_TIERS).optional()
  })
  .strict();

export const sourceStatusesSchema = z.array(sourceStatusSchema);

export const runStatusSchema = z
  .object({
    runId: nonEmptyStringSchema,
    startedAt: isoDateTimeSchema,
    finishedAt: isoDateTimeSchema,
    cadence: runCadenceSchema,
    domainsRun: z.array(nonEmptyStringSchema),
    sourcesOk: z.number().int().nonnegative(),
    sourcesFailed: z.number().int().nonnegative(),
    quarantinedSamples: z.number().int().nonnegative(),
    deltaMonths: z.number().finite(),
    bandWidthDays: z.number().finite().nonnegative(),
    status: runHealthStatusSchema,
    stale: z.boolean().optional(),
    commitSha: nonEmptyStringSchema.optional()
  })
  .strict();

export const newsItemSchema = z
  .object({
    title: nonEmptyStringSchema,
    url: urlSchema,
    source: nonEmptyStringSchema,
    publishedAt: isoDateTimeSchema,
    orgs: z.array(nonEmptyStringSchema)
  })
  .strict();

export const newsSchema = z.array(newsItemSchema);

export const staticDataSchemas = {
  "engine_state.weak-agi.json": engineStateSchema,
  "engine_state.transformative-ai.json": engineStateSchema,
  "engine_state.strong-agi.json": engineStateSchema,
  "estimate_history.json": estimateHistorySchema,
  "factors.json": factorsSchema,
  "timeline.json": timelineSchema,
  "jobs.json": jobsImpactSchema,
  "sources.json": sourceStatusesSchema,
  "status.json": runStatusSchema,
  "news.json": newsSchema
} as const;

export type StaticDataFile = keyof typeof staticDataSchemas;
export type ConfidenceBand = z.infer<typeof confidenceBandSchema>;
export type Mover = z.infer<typeof moverSchema>;
export type EngineState = z.infer<typeof engineStateSchema>;
export type EstimatePoint = z.infer<typeof estimatePointSchema>;
export type FactorSnapshot = z.infer<typeof factorSnapshotSchema>;
export type TimelineEvent = z.infer<typeof timelineEventSchema>;
export type JobsImpact = z.infer<typeof jobsImpactSchema>;
export type SourceStatus = z.infer<typeof sourceStatusSchema>;
export type RunStatus = z.infer<typeof runStatusSchema>;

export function parseEngineState(input: unknown): EngineState {
  return engineStateSchema.parse(input);
}

export function parseEstimateHistory(input: unknown): EstimatePoint[] {
  return estimateHistorySchema.parse(input);
}

export function parseFactors(input: unknown): FactorSnapshot[] {
  return factorsSchema.parse(input);
}

export function parseTimeline(input: unknown): TimelineEvent[] {
  return timelineSchema.parse(input);
}

export function parseJobsImpact(input: unknown): JobsImpact {
  return jobsImpactSchema.parse(input);
}

export function parseSourceStatuses(input: unknown): SourceStatus[] {
  return sourceStatusesSchema.parse(input);
}

export function parseRunStatus(input: unknown): RunStatus {
  return runStatusSchema.parse(input);
}

export function parseStaticDataFile(fileName: StaticDataFile, input: unknown): unknown {
  return staticDataSchemas[fileName].parse(input);
}
