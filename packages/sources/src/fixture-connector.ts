import type {
  ConnectorContext,
  ConnectorResult,
  FactorSample,
  FixtureConnector,
} from "./types.js";
import type { SourceDef } from "@agi-countdown/config";

type FixtureSampleSeed = Omit<
  FactorSample,
  "sourceId" | "observedAt" | "collectedAt"
>;

const fixtureSamplesBySourceId: Record<string, readonly FixtureSampleSeed[]> = {
  "fixture-hourly-signals": [
    {
      factorId: "forecast-consensus-anchor",
      raw: 0.62,
      unit: "probability-0-1",
      normalized: 0.62,
      confidence: 0.92,
      citation: "https://example.com/agi-countdown/fixtures/hourly-signals#forecast-consensus-anchor",
      quarantined: false,
      notes: "Scaffold value shaped like a forecast-consensus sample.",
    },
    {
      factorId: "public-backlash-pressure",
      raw: 0.28,
      unit: "pressure-0-1",
      normalized: 0.28,
      confidence: 0.86,
      citation: "https://example.com/agi-countdown/fixtures/hourly-signals#public-backlash-pressure",
      quarantined: false,
      notes: "Scaffold value shaped like a sentiment-pressure sample.",
    },
  ],
  "fixture-daily-signals": [
    {
      factorId: "frontier-benchmark-saturation",
      raw: 0.71,
      unit: "saturation-0-1",
      normalized: 0.71,
      confidence: 0.9,
      citation: "https://example.com/agi-countdown/fixtures/daily-signals#frontier-benchmark-saturation",
      quarantined: false,
    },
    {
      factorId: "research-velocity",
      raw: 184,
      unit: "papers-per-day",
      normalized: 0.56,
      confidence: 0.84,
      citation: "https://example.com/agi-countdown/fixtures/daily-signals#research-velocity",
      quarantined: false,
    },
    {
      factorId: "adoption-usage",
      raw: 0.64,
      unit: "usage-index-0-1",
      normalized: 0.64,
      confidence: 0.88,
      citation: "https://example.com/agi-countdown/fixtures/daily-signals#adoption-usage",
      quarantined: false,
    },
  ],
  "fixture-weekly-signals": [
    {
      factorId: "training-compute-growth",
      raw: 2.4e25,
      unit: "training-flop",
      normalized: 0.69,
      confidence: 0.87,
      citation: "https://example.com/agi-countdown/fixtures/weekly-signals#training-compute-growth",
      quarantined: false,
    },
    {
      factorId: "datacenter-capex",
      raw: 135000000000,
      unit: "usd-annualized",
      normalized: 0.61,
      confidence: 0.8,
      citation: "https://example.com/agi-countdown/fixtures/weekly-signals#datacenter-capex",
      quarantined: false,
    },
    {
      factorId: "energy-headroom",
      raw: 0.42,
      unit: "constraint-0-1",
      normalized: 0.42,
      confidence: 0.82,
      citation: "https://example.com/agi-countdown/fixtures/weekly-signals#energy-headroom",
      quarantined: false,
    },
    {
      factorId: "policy-friction",
      raw: 0.33,
      unit: "friction-0-1",
      normalized: 0.33,
      confidence: 0.78,
      citation: "https://example.com/agi-countdown/fixtures/weekly-signals#policy-friction",
      quarantined: false,
    },
    {
      factorId: "labor-automation-exposure",
      raw: 0.48,
      unit: "exposure-0-1",
      normalized: 0.48,
      confidence: 0.81,
      citation: "https://example.com/agi-countdown/fixtures/weekly-signals#labor-automation-exposure",
      quarantined: false,
    },
  ],
};

export const fixtureConnector: FixtureConnector = {
  parser: "fixture",
  mode: "fixture",
  fixtureVersion: "2026-06-21.scaffold",
  supports(source: SourceDef): boolean {
    return source.parser === "fixture";
  },
  async fetch(
    source: SourceDef,
    context: ConnectorContext,
  ): Promise<ConnectorResult> {
    const fetchedAt = context.now.toISOString();
    const seeds = fixtureSamplesBySourceId[source.id] ?? [];

    return {
      sourceId: source.id,
      fetchedAt,
      samples: seeds.map((seed) => ({
        ...seed,
        sourceId: source.id,
        observedAt: fetchedAt,
        collectedAt: fetchedAt,
      })),
      warnings:
        seeds.length === 0
          ? [`Fixture connector has no sample set for ${source.id}.`]
          : [],
    };
  },
};
