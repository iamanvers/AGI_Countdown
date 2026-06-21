import type { RefreshCadence, SourceDef } from "@agi-countdown/config";

export type ConnectorMode = "fixture" | "free-structured";

export type FactorRawValue = number | string | boolean;

export type FactorSample = {
  factorId: string;
  sourceId: string;
  observedAt: string;
  collectedAt: string;
  raw: FactorRawValue;
  unit: string;
  normalized?: number;
  confidence: number;
  citation: string;
  quarantined: boolean;
  notes?: string;
  metadata?: Record<string, string | number | boolean>;
};

export type ConnectorContext = {
  now: Date;
  cadence: RefreshCadence | "all";
};

export type ConnectorResult = {
  sourceId: string;
  fetchedAt: string;
  samples: FactorSample[];
  warnings: string[];
};

export type SourceConnector = {
  parser: string;
  mode: ConnectorMode;
  supports(source: SourceDef): boolean;
  fetch(source: SourceDef, context: ConnectorContext): Promise<ConnectorResult>;
};

export type FixtureConnector = SourceConnector & {
  mode: "fixture";
  fixtureVersion: string;
};

export type FreeStructuredConnector = SourceConnector & {
  mode: "free-structured";
  rateLimitKey?: string;
};
