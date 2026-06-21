import { curatedConnector } from "./curated-connector.js";
import { liveConnectors } from "./live-connectors.js";
import type { SourceConnector } from "./types.js";

/** Live structured connectors, keyed by parser id. */
export const connectorRegistry = [
  ...liveConnectors,
  curatedConnector,
] as const satisfies readonly SourceConnector[];

/**
 * Resolve a connector for a source parser. Live connectors match by parser id;
 * everything else falls back to the curated connector, so every registered
 * source yields real, cited data (live where available, curated otherwise).
 */
export function findConnector(parser: string): SourceConnector {
  return liveConnectors.find((connector) => connector.parser === parser) ?? curatedConnector;
}
