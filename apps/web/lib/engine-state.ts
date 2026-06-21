export type DefinitionId = "weak-agi" | "transformative-ai" | "strong-agi";

export type EngineState = {
  runId: string;
  ts: string;
  definition: DefinitionId;
  tAgi: string;
  progress: number;
  band: {
    earlyP10: string;
    lateP90: string;
  };
  anchor: string;
  deltaMonths: number;
  movers: Mover[];
  rates?: {
    computePerSec?: number;
    papersPerDay?: number;
    investUsdPerSec?: number;
  };
  stale?: boolean;
};

export type Mover = {
  factorId: string;
  contributionMonths: number;
  rationale: string;
  citation: string;
};

export const definitions: Array<{ id: DefinitionId; label: string; shortLabel: string }> = [
  { id: "weak-agi", label: "Weak AGI", shortLabel: "Weak" },
  { id: "transformative-ai", label: "Transformative AI", shortLabel: "Transformative" },
  { id: "strong-agi", label: "Strong AGI", shortLabel: "Strong" }
];

export const defaultDefinition: DefinitionId = "transformative-ai";

export function dataPathForDefinition(definition: DefinitionId) {
  return `/data/engine_state.${definition}.json`;
}

export async function fetchEngineState(definition: DefinitionId, signal?: AbortSignal) {
  const path = dataPathForDefinition(definition);
  const response = await fetch(path, {
    cache: "no-store",
    signal
  });

  if (!response.ok) {
    throw new Error(`Unable to load ${path}`);
  }

  const payload = (await response.json()) as Partial<EngineState>;
  return normalizeEngineState(payload, definition);
}

function normalizeEngineState(payload: Partial<EngineState>, fallbackDefinition: DefinitionId): EngineState {
  if (!payload.tAgi || !payload.band?.earlyP10 || !payload.band?.lateP90 || typeof payload.progress !== "number") {
    throw new Error("Engine state is missing required countdown fields.");
  }

  return {
    runId: payload.runId ?? "unknown-run",
    ts: payload.ts ?? new Date().toISOString(),
    definition: payload.definition ?? fallbackDefinition,
    tAgi: payload.tAgi,
    progress: clamp(payload.progress, 0, 100),
    band: {
      earlyP10: payload.band.earlyP10,
      lateP90: payload.band.lateP90
    },
    anchor: payload.anchor ?? payload.tAgi,
    deltaMonths: payload.deltaMonths ?? 0,
    movers: Array.isArray(payload.movers) ? payload.movers : [],
    rates: payload.rates,
    stale: payload.stale
  };
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
