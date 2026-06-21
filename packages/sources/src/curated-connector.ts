import type { SourceDef } from "@agi-countdown/config";
import { curatedFactorSeedsBySource } from "./curated-data.js";
import type {
  ConnectorContext,
  ConnectorResult,
  FactorSample,
  SourceConnector,
} from "./types.js";

/**
 * Curated connector — emits real, cited reference values for any source that has
 * a curated seed. Used for sources without a live structured API, and as the
 * deterministic fallback when a live connector fails. Every value carries a real
 * citation drawn from the seed.
 */
export const curatedConnector: SourceConnector = {
  parser: "curated",
  mode: "free-structured",
  supports: (source) => curatedFactorSeedsBySource[source.id] !== undefined,
  async fetch(source: SourceDef, context: ConnectorContext): Promise<ConnectorResult> {
    const fetchedAt = context.now.toISOString();
    const seeds = curatedFactorSeedsBySource[source.id] ?? [];

    const samples: FactorSample[] = seeds.map((seed) => ({
      factorId: seed.factorId,
      sourceId: source.id,
      observedAt: fetchedAt,
      collectedAt: fetchedAt,
      raw: seed.raw,
      unit: seed.unit,
      normalized: seed.normalized,
      confidence: seed.confidence,
      citation: seed.citation,
      quarantined: false,
      notes: seed.notes,
    }));

    return {
      sourceId: source.id,
      fetchedAt,
      samples,
      warnings:
        seeds.length === 0
          ? [`No curated seed for source "${source.id}".`]
          : [],
    };
  },
};
