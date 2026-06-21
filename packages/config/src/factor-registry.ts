import type { FactorDef } from "./types.js";
import { indexById } from "./registry-utils.js";

export const factorRegistry = [
  {
    id: "forecast-consensus-anchor",
    label: "Forecast consensus",
    category: "internal",
    domain: "forecasts",
    description:
      "Definition-matched crowd and market expectations that set the baseline anchor before live factors move it.",
    sources: ["metaculus-agi-questions", "manifold-ai-markets"],
    normalization: "zscore",
    sign: 1,
    weight: 8,
    cadence: "hourly",
    bounds: {
      min: 0,
      max: 1,
    },
  },
  {
    id: "frontier-benchmark-saturation",
    label: "Frontier benchmark saturation",
    category: "internal",
    domain: "benchmarks",
    description:
      "Composite saturation across frontier benchmark leaderboards, tracked separately from the date estimate.",
    sources: ["papers-with-code-leaderboards", "lmarena-leaderboard"],
    normalization: "momentum-01",
    sign: 1,
    weight: 7,
    cadence: "daily",
    bounds: {
      min: 0,
      max: 1,
    },
  },
  {
    id: "training-compute-growth",
    label: "Training compute growth",
    category: "internal",
    domain: "compute",
    description:
      "Growth in frontier training compute and related scaling indicators.",
    sources: ["epoch-ai-notable-models"],
    normalization: "log-zscore",
    sign: 1,
    weight: 6,
    cadence: "weekly",
    transform: "log10",
    bounds: {
      min: 0,
    },
  },
  {
    id: "research-velocity",
    label: "Research velocity",
    category: "internal",
    domain: "research",
    description:
      "AI research output and citation momentum from structured paper feeds.",
    sources: ["arxiv-ai-paper-volume"],
    normalization: "zscore",
    sign: 1,
    weight: 3,
    cadence: "daily",
    bounds: {
      min: 0,
    },
  },
  {
    id: "adoption-usage",
    label: "Adoption and usage",
    category: "internal",
    domain: "adoption",
    description:
      "Public model usage, downloads, and deployment proxies from structured usage feeds.",
    sources: ["openrouter-usage", "hugging-face-hub"],
    normalization: "momentum-01",
    sign: 1,
    weight: 5,
    cadence: "daily",
    bounds: {
      min: 0,
      max: 1,
    },
  },
  {
    id: "datacenter-capex",
    label: "Datacenter capex",
    category: "internal",
    domain: "economics",
    description:
      "Investment and revenue signals that proxy buildout capacity for frontier systems.",
    sources: ["hyperscaler-ir", "nvidia-earnings"],
    normalization: "log-zscore",
    sign: 1,
    weight: 4,
    cadence: "monthly",
    transform: "log10",
    bounds: {
      min: 0,
    },
  },
  {
    id: "energy-headroom",
    label: "Energy headroom",
    category: "external",
    domain: "energy",
    description:
      "Electricity and grid constraints that can slow datacenter buildout.",
    sources: ["eia-electricity", "ember-electricity"],
    normalization: "zscore",
    sign: -1,
    weight: 5,
    cadence: "weekly",
    bounds: {
      min: 0,
      max: 1,
    },
  },
  {
    id: "policy-friction",
    label: "Policy friction",
    category: "external",
    domain: "policy",
    description:
      "Regulatory and governance pressure that can slow deployment or constrain scaling.",
    sources: ["oecd-ai-policy", "nist-ai-risk"],
    normalization: "momentum-01",
    sign: -1,
    weight: 4,
    cadence: "weekly",
    bounds: {
      min: 0,
      max: 1,
    },
  },
  {
    id: "public-backlash-pressure",
    label: "Public backlash pressure",
    category: "external",
    domain: "sentiment",
    description:
      "News tone and public pressure that can create deployment drag.",
    sources: ["gdelt-ai-tone"],
    normalization: "zscore",
    sign: -1,
    weight: 3,
    cadence: "hourly",
    bounds: {
      min: 0,
      max: 1,
    },
  },
  {
    id: "labor-automation-exposure",
    label: "Labor automation exposure",
    category: "external",
    domain: "jobs",
    description:
      "Occupation-level exposure and automation signals for broad economic deployment.",
    sources: ["onet-occupation-data", "anthropic-economic-index"],
    normalization: "momentum-01",
    sign: 1,
    weight: 4,
    cadence: "monthly",
    bounds: {
      min: 0,
      max: 1,
    },
  },
] as const satisfies readonly FactorDef[];

export const factorsById = indexById(factorRegistry);

export type FactorEntry = (typeof factorRegistry)[number];
export type FactorId = FactorEntry["id"];
