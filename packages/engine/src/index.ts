export type AgiDefinition = "weak-agi" | "transformative-ai" | "strong-agi";

export type FactorSign = 1 | -1;

export type AnchorSourceInput = {
  id: string;
  median: string;
  p10?: string;
  p90?: string;
  weight?: number;
};

export type AnchorInput = {
  date?: string;
  earlyP10?: string;
  lateP90?: string;
  sources?: AnchorSourceInput[];
};

export type FactorInput = {
  factorId: string;
  normalized: number;
  sign: FactorSign;
  weight: number;
  confidence?: number;
  volatility?: number;
  citation?: string;
  rationale?: string;
  quarantined?: boolean;
};

export type ProgressComponent =
  | "benchmarkSaturation"
  | "computeVsRequired"
  | "economicDeployment";

export type ProgressWeights = Record<ProgressComponent, number>;

export type ProgressSignals = Partial<Record<ProgressComponent, number>> & {
  weights?: Partial<ProgressWeights>;
};

export type ConfidenceOptions = {
  factorVolatilityMultiplier?: number;
  minimumBandMonths?: number;
};

export type EngineRates = {
  computePerSec?: number;
  papersPerDay?: number;
  investUsdPerSec?: number;
};

export type EngineInput = {
  runId?: string;
  ts: string;
  definition: AgiDefinition;
  anchor: AnchorInput;
  factors?: FactorInput[];
  progress: ProgressSignals;
  maxShiftMonths?: number;
  confidence?: ConfidenceOptions;
  rates?: EngineRates;
  stale?: boolean;
};

export type ConfidenceBand = {
  earlyP10: string;
  lateP90: string;
};

export type Mover = {
  factorId: string;
  contributionMonths: number;
  rationale: string;
  citation: string;
};

export type EngineState = {
  runId: string;
  ts: string;
  definition: AgiDefinition;
  tAgi: string;
  progress: number;
  band: ConfidenceBand;
  anchor: string;
  deltaMonths: number;
  movers: Mover[];
  rates?: EngineRates;
  stale?: boolean;
};

type WeightedValue = {
  label: string;
  value: number;
  weight: number;
};

type ResolvedAnchor = {
  medianMs: number;
  earlyMs: number;
  lateMs: number;
};

type FactorContribution = {
  factorId: string;
  rawContributionMonths: number;
  appliedContributionMonths: number;
  volatility: number;
  rationale: string;
  citation: string;
};

const AVERAGE_DAYS_PER_MONTH = 365.2425 / 12;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_AVERAGE_MONTH = AVERAGE_DAYS_PER_MONTH * MS_PER_DAY;
const DEFAULT_MAX_SHIFT_MONTHS = 36;
const EPSILON = 1e-9;

export const DEFAULT_PROGRESS_WEIGHTS: Record<AgiDefinition, ProgressWeights> = {
  "weak-agi": {
    benchmarkSaturation: 0.5,
    computeVsRequired: 0.35,
    economicDeployment: 0.15
  },
  "transformative-ai": {
    benchmarkSaturation: 0.3,
    computeVsRequired: 0.3,
    economicDeployment: 0.4
  },
  "strong-agi": {
    benchmarkSaturation: 0.4,
    computeVsRequired: 0.45,
    economicDeployment: 0.15
  }
};

export function computeEngineState(input: EngineInput): EngineState {
  const tsMs = parseIsoDate(input.ts, "ts");
  const ts = toIso(tsMs);
  const anchor = resolveAnchor(input.anchor);
  const maxShiftMonths = readNonNegativeNumber(
    input.maxShiftMonths ?? DEFAULT_MAX_SHIFT_MONTHS,
    "maxShiftMonths"
  );

  const rawContributions = computeRawFactorContributions(input.factors ?? []);
  const rawDeltaMonths = rawContributions.reduce(
    (sum, contribution) => sum + contribution.rawContributionMonths,
    0
  );
  const clampedDeltaMonths = clamp(rawDeltaMonths, -maxShiftMonths, maxShiftMonths);
  const deltaMonths = round(clampedDeltaMonths);
  const scale =
    Math.abs(rawDeltaMonths) <= EPSILON ? 1 : deltaMonths / rawDeltaMonths;
  const contributions = rawContributions.map((contribution) => ({
    ...contribution,
    appliedContributionMonths: round(contribution.rawContributionMonths * scale)
  }));

  const tAgiMs = addMonths(anchor.medianMs, deltaMonths);
  const band = computeConfidenceBand(anchor, deltaMonths, contributions, input.confidence);
  const state: EngineState = {
    runId: input.runId ?? `${input.definition}:${ts}`,
    ts,
    definition: input.definition,
    tAgi: toIso(tAgiMs),
    progress: computeProgress(input.definition, input.progress),
    band,
    anchor: toIso(anchor.medianMs),
    deltaMonths,
    movers: rankMovers(contributions)
  };

  if (input.rates !== undefined) {
    state.rates = input.rates;
  }

  if (input.stale !== undefined) {
    state.stale = input.stale;
  }

  return state;
}

export function computeProgress(
  definition: AgiDefinition,
  signals: ProgressSignals
): number {
  const weights = normalizeProgressWeights({
    ...DEFAULT_PROGRESS_WEIGHTS[definition],
    ...signals.weights
  });

  const score =
    clamp01(signals.benchmarkSaturation ?? 0) * weights.benchmarkSaturation +
    clamp01(signals.computeVsRequired ?? 0) * weights.computeVsRequired +
    clamp01(signals.economicDeployment ?? 0) * weights.economicDeployment;

  return round(clamp(score * 100, 0, 100), 4);
}

export function addMonthsToIso(isoDate: string, months: number): string {
  return toIso(addMonths(parseIsoDate(isoDate, "isoDate"), months));
}

function resolveAnchor(anchor: AnchorInput): ResolvedAnchor {
  if (anchor.sources !== undefined && anchor.sources.length > 0) {
    const medians = anchor.sources.map((source) =>
      weightedDate(source.id, source.median, source.weight)
    );
    const earlyDates = anchor.sources.map((source) =>
      weightedDate(source.id, source.p10 ?? source.median, source.weight)
    );
    const lateDates = anchor.sources.map((source) =>
      weightedDate(source.id, source.p90 ?? source.median, source.weight)
    );

    return normalizeAnchorBand(
      weightedQuantile(medians, 0.5),
      weightedQuantile(earlyDates, 0.1),
      weightedQuantile(lateDates, 0.9)
    );
  }

  if (anchor.date === undefined) {
    throw new TypeError("anchor.date or at least one anchor.sources entry is required");
  }

  return normalizeAnchorBand(
    parseIsoDate(anchor.date, "anchor.date"),
    parseIsoDate(anchor.earlyP10 ?? anchor.date, "anchor.earlyP10"),
    parseIsoDate(anchor.lateP90 ?? anchor.date, "anchor.lateP90")
  );
}

function weightedDate(id: string, date: string, weight = 1): WeightedValue {
  return {
    label: id,
    value: parseIsoDate(date, `anchor.sources.${id}`),
    weight: readNonNegativeNumber(weight, `anchor.sources.${id}.weight`)
  };
}

function normalizeAnchorBand(medianMs: number, earlyMs: number, lateMs: number): ResolvedAnchor {
  const ordered = [earlyMs, medianMs, lateMs].sort((a, b) => a - b);
  const first = ordered[0];
  const last = ordered[2];

  if (first === undefined || last === undefined) {
    throw new TypeError("anchor band could not be resolved");
  }

  return {
    medianMs,
    earlyMs: first,
    lateMs: last
  };
}

function computeRawFactorContributions(factors: FactorInput[]): FactorContribution[] {
  return factors.flatMap((factor) => {
    if (factor.quarantined === true) {
      return [];
    }

    if (factor.sign !== 1 && factor.sign !== -1) {
      throw new TypeError(`factor ${factor.factorId} sign must be 1 or -1`);
    }

    const normalized = readFiniteNumber(
      factor.normalized,
      `factors.${factor.factorId}.normalized`
    );
    const weight = readNonNegativeNumber(factor.weight, `factors.${factor.factorId}.weight`);
    const confidence = clamp01(
      readFiniteNumber(factor.confidence ?? 1, `factors.${factor.factorId}.confidence`)
    );

    if (confidence <= EPSILON || weight <= EPSILON) {
      return [];
    }

    const rawContributionMonths = -factor.sign * weight * normalized * confidence;
    const roundedRawContributionMonths = round(rawContributionMonths);

    return [
      {
        factorId: factor.factorId,
        rawContributionMonths: roundedRawContributionMonths,
        appliedContributionMonths: roundedRawContributionMonths,
        volatility: clamp01(
          readFiniteNumber(factor.volatility ?? 0, `factors.${factor.factorId}.volatility`)
        ),
        rationale:
          factor.rationale ??
          `${factor.factorId} moved the estimate ${
            roundedRawContributionMonths < 0 ? "sooner" : "later"
          }.`,
        citation: factor.citation ?? ""
      }
    ];
  });
}

function computeConfidenceBand(
  anchor: ResolvedAnchor,
  deltaMonths: number,
  contributions: FactorContribution[],
  confidence?: ConfidenceOptions
): ConfidenceBand {
  const volatilityMultiplier = readNonNegativeNumber(
    confidence?.factorVolatilityMultiplier ?? 1,
    "confidence.factorVolatilityMultiplier"
  );
  const minimumBandMonths = readNonNegativeNumber(
    confidence?.minimumBandMonths ?? 0,
    "confidence.minimumBandMonths"
  );
  const factorVolatilityMonths =
    contributions.reduce(
      (sum, contribution) =>
        sum +
        Math.abs(contribution.appliedContributionMonths) *
          contribution.volatility *
          volatilityMultiplier,
      0
    ) || 0;

  const targetMs = addMonths(anchor.medianMs, deltaMonths);
  const earlyMs = Math.min(
    addMonths(anchor.earlyMs, deltaMonths - factorVolatilityMonths),
    addMonths(targetMs, -minimumBandMonths)
  );
  const lateMs = Math.max(
    addMonths(anchor.lateMs, deltaMonths + factorVolatilityMonths),
    addMonths(targetMs, minimumBandMonths)
  );

  return {
    earlyP10: toIso(earlyMs),
    lateP90: toIso(lateMs)
  };
}

function rankMovers(contributions: FactorContribution[]): Mover[] {
  return contributions
    .filter((contribution) => Math.abs(contribution.appliedContributionMonths) > EPSILON)
    .map((contribution) => ({
      factorId: contribution.factorId,
      contributionMonths: contribution.appliedContributionMonths,
      rationale: contribution.rationale,
      citation: contribution.citation
    }))
    .sort((a, b) => {
      const contributionOrder =
        Math.abs(b.contributionMonths) - Math.abs(a.contributionMonths);

      if (Math.abs(contributionOrder) > EPSILON) {
        return contributionOrder;
      }

      return a.factorId.localeCompare(b.factorId);
    });
}

function normalizeProgressWeights(weights: ProgressWeights): ProgressWeights {
  const benchmarkSaturation = readNonNegativeNumber(
    weights.benchmarkSaturation,
    "progress.weights.benchmarkSaturation"
  );
  const computeVsRequired = readNonNegativeNumber(
    weights.computeVsRequired,
    "progress.weights.computeVsRequired"
  );
  const economicDeployment = readNonNegativeNumber(
    weights.economicDeployment,
    "progress.weights.economicDeployment"
  );
  const total = benchmarkSaturation + computeVsRequired + economicDeployment;

  if (total <= EPSILON) {
    throw new TypeError("progress weights must contain at least one positive value");
  }

  return {
    benchmarkSaturation: benchmarkSaturation / total,
    computeVsRequired: computeVsRequired / total,
    economicDeployment: economicDeployment / total
  };
}

function weightedQuantile(values: WeightedValue[], quantile: number): number {
  const sorted = values
    .filter((value) => value.weight > EPSILON)
    .sort((a, b) => {
      if (a.value !== b.value) {
        return a.value - b.value;
      }

      return a.label.localeCompare(b.label);
    });

  if (sorted.length === 0) {
    throw new TypeError("weighted quantile requires at least one positive-weight value");
  }

  const totalWeight = sorted.reduce((sum, value) => sum + value.weight, 0);
  const threshold = totalWeight * clamp01(quantile);
  let cumulativeWeight = 0;

  for (const value of sorted) {
    cumulativeWeight += value.weight;

    if (cumulativeWeight >= threshold) {
      return value.value;
    }
  }

  const last = sorted[sorted.length - 1];

  if (last === undefined) {
    throw new TypeError("weighted quantile could not be resolved");
  }

  return last.value;
}

function addMonths(timestampMs: number, months: number): number {
  return Math.round(timestampMs + readFiniteNumber(months, "months") * MS_PER_AVERAGE_MONTH);
}

function parseIsoDate(value: string, fieldName: string): number {
  const parsed = Date.parse(value);

  if (!Number.isFinite(parsed)) {
    throw new TypeError(`${fieldName} must be a valid ISO date string`);
  }

  return parsed;
}

function readFiniteNumber(value: number, fieldName: string): number {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${fieldName} must be a finite number`);
  }

  return value;
}

function readNonNegativeNumber(value: number, fieldName: string): number {
  const finiteValue = readFiniteNumber(value, fieldName);

  if (finiteValue < 0) {
    throw new TypeError(`${fieldName} must be non-negative`);
  }

  return finiteValue;
}

function clamp01(value: number): number {
  return clamp(readFiniteNumber(value, "value"), 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round(value: number, digits = 6): number {
  const scale = 10 ** digits;
  return Math.round((value + Number.EPSILON) * scale) / scale;
}

function toIso(timestampMs: number): string {
  return new Date(Math.round(timestampMs)).toISOString();
}
