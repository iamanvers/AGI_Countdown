export type RefreshCadence = "hourly" | "daily" | "weekly" | "monthly";

export type AgiDefinitionId = "weak-agi" | "transformative-ai" | "strong-agi";

export type ProgressWeights = {
  benchmarkSaturation: number;
  computeVsRequired: number;
  economicDeployment: number;
};

export type ForecastWeights = {
  metaculus: number;
  markets: number;
  experts: number;
  computeModels: number;
};

export type AgiDefinition = {
  id: AgiDefinitionId;
  name: string;
  shortName: string;
  summary: string;
  baselineAnchorIso: string;
  maxShiftMonths: number;
  progressWeights: ProgressWeights;
  forecastWeights: ForecastWeights;
};

export type FactorCategory = "internal" | "external";

export type FactorDomain =
  | "forecasts"
  | "benchmarks"
  | "compute"
  | "research"
  | "adoption"
  | "economics"
  | "energy"
  | "policy"
  | "sentiment"
  | "jobs"
  | "hardware"
  | "autonomy"
  | "safety"
  | "labs"
  | "media";

export type SourceTier = "primary" | "secondary" | "tertiary";

export type NormalizationKind = "zscore" | "momentum-01" | "log-zscore";

export type FactorDef = {
  id: string;
  label: string;
  category: FactorCategory;
  domain: FactorDomain;
  description: string;
  sources: string[];
  normalization: NormalizationKind;
  sign: 1 | -1;
  weight: number;
  cadence: RefreshCadence;
  transform?: "log10" | "none";
  bounds?: {
    min?: number;
    max?: number;
  };
};

export type SourceAccessMethod = "api" | "scrape" | "file" | "feed";

export type SourceIngestion = "structured" | "curated";

export type SourceDef = {
  id: string;
  name: string;
  domain: FactorDomain | "scaffold";
  accessMethod: SourceAccessMethod;
  ingestion: SourceIngestion;
  authNeeded: boolean;
  cadence: RefreshCadence;
  rateLimit?: string;
  tosNotes?: string;
  parser: string;
  url: string;
  tier?: SourceTier;
};

export type RegistryIndex<T extends { id: string }> = Record<T["id"], T>;
