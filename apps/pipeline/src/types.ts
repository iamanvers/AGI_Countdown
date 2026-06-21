import type {
  AgiDefinition,
  FactorDef,
  RefreshCadence,
  SourceDef,
} from "@agi-countdown/config";
import type { FactorSample } from "@agi-countdown/sources";

export type RefreshScope = RefreshCadence | "all";

export type SourceRunStatus = {
  sourceId: string;
  name: string;
  parser: string;
  cadence: RefreshCadence;
  status: "ok" | "skipped" | "failed";
  fetchedAt: string;
  sampleCount: number;
  warnings: string[];
};

export type RefreshManifest = {
  schemaVersion: 1;
  runId: string;
  generatedAt: string;
  requestedCadence: RefreshScope;
  dueCadences: RefreshCadence[];
  outputFiles: string[];
  notes: string[];
};

export type EngineInputFactor = {
  factor: FactorDef;
  samples: FactorSample[];
};

export type EngineBoundaryInput = {
  schemaVersion: 1;
  runId: string;
  generatedAt: string;
  boundary: {
    status: "waiting-for-engine-and-shared";
    expectedEnginePackage: "@agi-countdown/engine";
    expectedSharedPackage: "@agi-countdown/shared";
  };
  definitions: readonly AgiDefinition[];
  factors: EngineInputFactor[];
  sources: readonly SourceDef[];
};
