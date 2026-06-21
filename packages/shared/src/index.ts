export const AGI_DEFINITIONS = ["weak-agi", "transformative-ai", "strong-agi"] as const;

export type AgiDefinition = (typeof AGI_DEFINITIONS)[number];
export type DefinitionId = AgiDefinition;
export type IsoDate = string;
export type IsoDateTime = string;

export type DefinitionMetadata = {
  id: AgiDefinition;
  label: string;
  summary: string;
};

export const DEFINITION_METADATA = {
  "weak-agi": {
    id: "weak-agi",
    label: "Weak AGI",
    summary: "Systems that can perform most digital knowledge tasks at a competent human level."
  },
  "transformative-ai": {
    id: "transformative-ai",
    label: "Transformative AI",
    summary: "AI capability and deployment large enough to reshape broad economic activity."
  },
  "strong-agi": {
    id: "strong-agi",
    label: "Strong AGI",
    summary: "Robust, general systems that can autonomously learn, plan, and execute across domains."
  }
} as const satisfies Record<AgiDefinition, DefinitionMetadata>;

export const DEFINITIONS = AGI_DEFINITIONS.map((id) => DEFINITION_METADATA[id]);

export const TIMELINE_SIGNIFICANCES = ["minor", "major", "landmark"] as const;
export type TimelineSignificance = (typeof TIMELINE_SIGNIFICANCES)[number];

export const TIMELINE_CATEGORIES = [
  "benchmark",
  "compute",
  "funding",
  "infrastructure",
  "jobs",
  "model-release",
  "policy",
  "research",
  "safety"
] as const;
export type TimelineCategory = (typeof TIMELINE_CATEGORIES)[number];

export const CURATION_MODES = ["curated", "feed"] as const;
export type CurationMode = (typeof CURATION_MODES)[number];

export const SOURCE_STATUSES = ["ok", "stale", "failed", "reference"] as const;
export type SourceHealthStatus = (typeof SOURCE_STATUSES)[number];

export const SOURCE_TIERS = ["primary", "secondary", "tertiary"] as const;
export type SourceTier = (typeof SOURCE_TIERS)[number];

export const DATA_CADENCES = ["hourly", "daily", "weekly", "monthly"] as const;
export type DataCadence = (typeof DATA_CADENCES)[number];

export const RUN_CADENCES = ["hourly", "daily", "weekly"] as const;
export type RunCadence = (typeof RUN_CADENCES)[number];

export const RUN_STATUSES = ["ok", "degraded", "failed"] as const;
export type RunHealthStatus = (typeof RUN_STATUSES)[number];

export type ConfidenceBand = {
  earlyP10: IsoDateTime;
  lateP90: IsoDateTime;
};

export type Mover = {
  factorId: string;
  contributionMonths: number;
  rationale: string;
  citation: string;
};

export type EngineRates = {
  computePerSec?: number;
  papersPerDay?: number;
  investUsdPerSec?: number;
};

export type EngineState = {
  runId: string;
  ts: IsoDateTime;
  definition: AgiDefinition;
  tAgi: IsoDateTime;
  progress: number;
  band: ConfidenceBand;
  anchor: IsoDateTime;
  deltaMonths: number;
  movers: Mover[];
  rates?: EngineRates;
  stale?: boolean;
};

export type EstimatePoint = {
  ts: IsoDateTime;
  definition: AgiDefinition;
  tAgi: IsoDateTime;
  progress: number;
  runId?: string;
  deltaMonths?: number;
  band?: ConfidenceBand;
};

export type FactorSnapshot = {
  factorId: string;
  sourceId: string;
  ts: IsoDateTime;
  raw: number | string;
  normalized: number;
  confidence: number;
  citation: string;
  quarantined: boolean;
  factorName?: string;
  domain?: string;
  momentum?: number;
  unit?: string;
  notes?: string;
};

export type TimelineEvent = {
  date: IsoDate;
  title: string;
  summary: string;
  significance: TimelineSignificance;
  category: string;
  citation: string;
  curatedBy: CurationMode;
  id?: string;
};

export type JobsSector = {
  sector: string;
  workforceSharePct: number;
  automationExposurePct: number;
  source: string;
  sourceId?: string;
  emergingRoles: Array<{ title: string; demandSignal: number }>;
  decliningRoles: string[];
};

export type JobsImpact = {
  ts: IsoDateTime;
  overallAutomationPct: number;
  sectors: JobsSector[];
  highlights: Array<{
    title: string;
    description: string;
    demandSignal: number;
    source: string;
    sourceId?: string;
  }>;
};

export type SourceStatus = {
  sourceId: string;
  name: string;
  url: string;
  lastFetchedAt: IsoDateTime;
  status: SourceHealthStatus;
  errorRate: number;
  domain?: string;
  cadence?: DataCadence;
  notes?: string;
  tier?: SourceTier;
};

export type RunStatus = {
  runId: string;
  startedAt: IsoDateTime;
  finishedAt: IsoDateTime;
  cadence: RunCadence;
  domainsRun: string[];
  sourcesOk: number;
  sourcesFailed: number;
  quarantinedSamples: number;
  deltaMonths: number;
  bandWidthDays: number;
  status: RunHealthStatus;
  stale?: boolean;
  commitSha?: string;
};
