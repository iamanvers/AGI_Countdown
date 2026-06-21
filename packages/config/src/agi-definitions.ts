import type { AgiDefinition } from "./types.js";

export const agiDefinitions = [
  {
    id: "weak-agi",
    name: "Weak AGI",
    shortName: "Weak",
    summary:
      "A broadly capable AI system that can complete most knowledge-work tasks with human-level reliability under supervision.",
    baselineAnchorIso: "2029-01-01T00:00:00.000Z",
    maxShiftMonths: 24,
    progressWeights: {
      benchmarkSaturation: 0.5,
      computeVsRequired: 0.3,
      economicDeployment: 0.2,
    },
    forecastWeights: {
      metaculus: 0.45,
      markets: 0.25,
      experts: 0.15,
      computeModels: 0.15,
    },
  },
  {
    id: "transformative-ai",
    name: "Transformative AI",
    shortName: "TAI",
    summary:
      "AI systems that measurably transform labor, research, and economic output across many sectors.",
    baselineAnchorIso: "2033-01-01T00:00:00.000Z",
    maxShiftMonths: 36,
    progressWeights: {
      benchmarkSaturation: 0.35,
      computeVsRequired: 0.25,
      economicDeployment: 0.4,
    },
    forecastWeights: {
      metaculus: 0.35,
      markets: 0.2,
      experts: 0.25,
      computeModels: 0.2,
    },
  },
  {
    id: "strong-agi",
    name: "Strong AGI",
    shortName: "Strong",
    summary:
      "A system with robust, general, autonomous capability across cognitive domains, including long-horizon tasks.",
    baselineAnchorIso: "2040-01-01T00:00:00.000Z",
    maxShiftMonths: 48,
    progressWeights: {
      benchmarkSaturation: 0.4,
      computeVsRequired: 0.4,
      economicDeployment: 0.2,
    },
    forecastWeights: {
      metaculus: 0.25,
      markets: 0.15,
      experts: 0.3,
      computeModels: 0.3,
    },
  },
] as const satisfies readonly AgiDefinition[];

export type AgiDefinitionEntry = (typeof agiDefinitions)[number];
