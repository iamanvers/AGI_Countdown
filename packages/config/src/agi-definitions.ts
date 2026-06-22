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
    progressScale: 1.25,
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
    // Near-term, capability-driven: benchmarks, research, adoption lead.
    domainEmphasis: {
      benchmarks: 1.5,
      research: 1.3,
      adoption: 1.2,
      autonomy: 1.1,
      compute: 1.1,
      energy: 0.7,
      policy: 0.7,
      safety: 0.7,
      hardware: 0.8,
      economics: 0.8,
      jobs: 0.8,
      sentiment: 0.8,
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
    progressScale: 0.8,
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
    // Deployment- and economy-driven: adoption, economics, jobs, energy lead.
    domainEmphasis: {
      adoption: 1.5,
      economics: 1.4,
      jobs: 1.4,
      energy: 1.2,
      sentiment: 1.1,
      benchmarks: 0.8,
      autonomy: 0.9,
      compute: 0.9,
      research: 0.9,
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
    progressScale: 0.5,
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
    // Deep capability + hard constraints: compute, autonomy, hardware, safety lead.
    domainEmphasis: {
      compute: 1.5,
      autonomy: 1.5,
      hardware: 1.3,
      research: 1.2,
      safety: 1.3,
      energy: 1.2,
      adoption: 0.7,
      jobs: 0.7,
    },
  },
] as const satisfies readonly AgiDefinition[];

export type AgiDefinitionEntry = (typeof agiDefinitions)[number];
