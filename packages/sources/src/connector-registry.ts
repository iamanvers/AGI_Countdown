import { fixtureConnector } from "./fixture-connector.js";
import type { SourceConnector } from "./types.js";

export const connectorRegistry = [fixtureConnector] as const satisfies readonly SourceConnector[];

export function findConnector(parser: string): SourceConnector | undefined {
  return connectorRegistry.find((connector) => connector.parser === parser);
}
