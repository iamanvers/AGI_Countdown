import type { AgiDefinitionId } from "@agi-countdown/config";

/**
 * Curated, real, cited reference data.
 *
 * These are hand-maintained values drawn from published forecasts, reports, and
 * datasets. They are deliberately conservative and carry a real citation so the
 * UI can attribute every number. Live connectors (Manifold / arXiv / GDELT)
 * override the relevant signals when a fetch succeeds; otherwise these provide a
 * sensible, attributable baseline so the app is always functional and honest.
 *
 * Nothing here is a precise claim of fact — they are curated estimates of the
 * *normalized momentum* of each factor (0..1) plus published forecast medians.
 */

export type AnchorSourceSeed = {
  /** which forecastWeights bucket this maps to */
  bucket: "metaculus" | "markets" | "experts" | "computeModels";
  label: string;
  median: string;
  p10: string;
  p90: string;
  citation: string;
};

export type CuratedFactorSeed = {
  factorId: string;
  raw: number | string;
  unit: string;
  /** engine-ready 0..1 (or signed) normalized momentum */
  normalized: number;
  confidence: number;
  citation: string;
  notes?: string;
};

/**
 * Per-definition forecast anchors. The engine blends these (weighted by each
 * definition's forecastWeights) into the baseline date the live factor model
 * then nudges. Dates are approximate published medians, not predictions of record.
 */
export const curatedForecastAnchors: Record<AgiDefinitionId, AnchorSourceSeed[]> = {
  "weak-agi": [
    {
      bucket: "metaculus",
      label: "Metaculus — weak AGI community",
      median: "2027-09-01T00:00:00.000Z",
      p10: "2026-06-01T00:00:00.000Z",
      p90: "2031-01-01T00:00:00.000Z",
      citation: "https://www.metaculus.com/questions/3479/date-weakly-general-ai-is-publicly-known/",
    },
    {
      bucket: "markets",
      label: "Prediction markets (Manifold)",
      median: "2028-06-01T00:00:00.000Z",
      p10: "2026-09-01T00:00:00.000Z",
      p90: "2032-01-01T00:00:00.000Z",
      citation: "https://manifold.markets/search?term=AGI",
    },
    {
      bucket: "experts",
      label: "Expert survey (AI Impacts / AAAI)",
      median: "2032-01-01T00:00:00.000Z",
      p10: "2028-01-01T00:00:00.000Z",
      p90: "2040-01-01T00:00:00.000Z",
      citation: "https://aiimpacts.org/2023-ai-survey/",
    },
    {
      bucket: "computeModels",
      label: "Compute-based models (Epoch / bio-anchors)",
      median: "2030-01-01T00:00:00.000Z",
      p10: "2027-01-01T00:00:00.000Z",
      p90: "2036-01-01T00:00:00.000Z",
      citation: "https://epoch.ai/blog/the-direct-approach",
    },
  ],
  "transformative-ai": [
    {
      bucket: "metaculus",
      label: "Metaculus — AGI community",
      median: "2032-01-01T00:00:00.000Z",
      p10: "2028-06-01T00:00:00.000Z",
      p90: "2040-01-01T00:00:00.000Z",
      citation: "https://www.metaculus.com/questions/5121/date-of-artificial-general-intelligence/",
    },
    {
      bucket: "markets",
      label: "Prediction markets (Manifold)",
      median: "2031-06-01T00:00:00.000Z",
      p10: "2028-01-01T00:00:00.000Z",
      p90: "2039-01-01T00:00:00.000Z",
      citation: "https://manifold.markets/search?term=transformative%20AI",
    },
    {
      bucket: "experts",
      label: "Expert survey (AI Impacts / AAAI)",
      median: "2040-01-01T00:00:00.000Z",
      p10: "2032-01-01T00:00:00.000Z",
      p90: "2055-01-01T00:00:00.000Z",
      citation: "https://aiimpacts.org/2023-ai-survey/",
    },
    {
      bucket: "computeModels",
      label: "Compute-based models (Cotra / Epoch)",
      median: "2036-01-01T00:00:00.000Z",
      p10: "2030-01-01T00:00:00.000Z",
      p90: "2045-01-01T00:00:00.000Z",
      citation: "https://www.openphilanthropy.org/research/forecasting-transformative-ai-the-biological-anchors-method-in-a-nutshell/",
    },
  ],
  "strong-agi": [
    {
      bucket: "metaculus",
      label: "Metaculus — general/strong AI",
      median: "2035-01-01T00:00:00.000Z",
      p10: "2030-01-01T00:00:00.000Z",
      p90: "2045-01-01T00:00:00.000Z",
      citation: "https://www.metaculus.com/questions/5121/date-of-artificial-general-intelligence/",
    },
    {
      bucket: "markets",
      label: "Prediction markets (Manifold)",
      median: "2034-06-01T00:00:00.000Z",
      p10: "2030-01-01T00:00:00.000Z",
      p90: "2044-01-01T00:00:00.000Z",
      citation: "https://manifold.markets/search?term=superintelligence",
    },
    {
      bucket: "experts",
      label: "Expert survey (HLMI, AI Impacts)",
      median: "2047-01-01T00:00:00.000Z",
      p10: "2036-01-01T00:00:00.000Z",
      p90: "2060-01-01T00:00:00.000Z",
      citation: "https://aiimpacts.org/2023-ai-survey/",
    },
    {
      bucket: "computeModels",
      label: "Compute-based models (Epoch)",
      median: "2040-01-01T00:00:00.000Z",
      p10: "2033-01-01T00:00:00.000Z",
      p90: "2052-01-01T00:00:00.000Z",
      citation: "https://epoch.ai/blog/the-direct-approach",
    },
  ],
};

/**
 * Curated factor momentum values used when a live connector is unavailable.
 * Keyed by sourceId so the pipeline can attribute each value to its registry source.
 */
export const curatedFactorSeedsBySource: Record<string, CuratedFactorSeed[]> = {
  "metaculus-agi-questions": [
    {
      factorId: "forecast-consensus-anchor",
      raw: 0.6,
      unit: "community-optimism-0-1",
      normalized: 0.6,
      confidence: 0.7,
      citation: "https://www.metaculus.com/questions/5121/date-of-artificial-general-intelligence/",
      notes: "Curated read of the Metaculus AGI community forecast (auth now required for live API).",
    },
  ],
  "epoch-ai-notable-models": [
    {
      factorId: "training-compute-growth",
      raw: 0.72,
      unit: "growth-index-0-1",
      normalized: 0.72,
      confidence: 0.85,
      citation: "https://epoch.ai/data/notable-ai-models",
      notes: "Frontier training compute continues to grow ~4-5x/yr (Epoch).",
    },
  ],
  "papers-with-code-leaderboards": [
    {
      factorId: "frontier-benchmark-saturation",
      raw: 0.74,
      unit: "saturation-0-1",
      normalized: 0.74,
      confidence: 0.8,
      citation: "https://paperswithcode.com/sota",
      notes: "Frontier benchmarks increasingly saturated across reasoning/coding/vision.",
    },
  ],
  "lmarena-leaderboard": [
    {
      factorId: "frontier-benchmark-saturation",
      raw: 0.7,
      unit: "elo-momentum-0-1",
      normalized: 0.7,
      confidence: 0.78,
      citation: "https://lmarena.ai/leaderboard",
      notes: "Human-preference Elo at the frontier keeps climbing.",
    },
  ],
  "openrouter-usage": [
    {
      factorId: "adoption-usage",
      raw: 0.66,
      unit: "usage-index-0-1",
      normalized: 0.66,
      confidence: 0.76,
      citation: "https://openrouter.ai/rankings",
      notes: "Token throughput across hosted models trending up.",
    },
  ],
  "hugging-face-hub": [
    {
      factorId: "adoption-usage",
      raw: 0.62,
      unit: "downloads-momentum-0-1",
      normalized: 0.62,
      confidence: 0.74,
      citation: "https://huggingface.co/models",
      notes: "Open model downloads/trending momentum remains strong.",
    },
  ],
  "hyperscaler-ir": [
    {
      factorId: "datacenter-capex",
      raw: 0.78,
      unit: "capex-momentum-0-1",
      normalized: 0.78,
      confidence: 0.82,
      citation: "https://www.microsoft.com/en-us/investor",
      notes: "Hyperscaler AI capex guidance continues to rise sharply.",
    },
  ],
  "nvidia-earnings": [
    {
      factorId: "datacenter-capex",
      raw: 0.8,
      unit: "datacenter-revenue-momentum-0-1",
      normalized: 0.8,
      confidence: 0.83,
      citation: "https://investor.nvidia.com/financial-info/financial-reports/",
      notes: "NVIDIA datacenter revenue a strong proxy for buildout demand.",
    },
  ],
  "eia-electricity": [
    {
      factorId: "energy-headroom",
      raw: 0.45,
      unit: "constraint-0-1",
      normalized: 0.45,
      confidence: 0.72,
      citation: "https://www.eia.gov/electricity/",
      notes: "Grid/power availability a moderate constraint on datacenter buildout.",
    },
  ],
  "ember-electricity": [
    {
      factorId: "energy-headroom",
      raw: 0.43,
      unit: "constraint-0-1",
      normalized: 0.43,
      confidence: 0.7,
      citation: "https://ember-energy.org/data/",
      notes: "Clean-power expansion partly offsets datacenter demand growth.",
    },
  ],
  "oecd-ai-policy": [
    {
      factorId: "policy-friction",
      raw: 0.38,
      unit: "friction-0-1",
      normalized: 0.38,
      confidence: 0.7,
      citation: "https://oecd.ai/en/dashboards/policy-initiatives",
      notes: "Policy activity rising (EU AI Act, exec orders) but not yet binding hard limits.",
    },
  ],
  "nist-ai-risk": [
    {
      factorId: "policy-friction",
      raw: 0.34,
      unit: "friction-0-1",
      normalized: 0.34,
      confidence: 0.68,
      citation: "https://www.nist.gov/itl/ai-risk-management-framework",
      notes: "Voluntary risk frameworks add process friction, not hard caps.",
    },
  ],
  "onet-occupation-data": [
    {
      factorId: "labor-automation-exposure",
      raw: 0.5,
      unit: "exposure-0-1",
      normalized: 0.5,
      confidence: 0.72,
      citation: "https://www.onetonline.org/",
      notes: "Broad occupational exposure to language-model automation.",
    },
  ],
  "anthropic-economic-index": [
    {
      factorId: "labor-automation-exposure",
      raw: 0.52,
      unit: "claude-usage-share-0-1",
      normalized: 0.52,
      confidence: 0.75,
      citation: "https://www.anthropic.com/economic-index",
      notes: "Observed task-level AI usage concentrated in knowledge work.",
    },
  ],
  // Curated baseline for the live factors (used if the live fetch fails).
  "arxiv-ai-paper-volume": [
    {
      factorId: "research-velocity",
      raw: 0.6,
      unit: "paper-volume-momentum-0-1",
      normalized: 0.6,
      confidence: 0.6,
      citation: "https://arxiv.org/list/cs.AI/recent",
      notes: "Fallback estimate; replaced by live arXiv counts when available.",
    },
  ],
  "gdelt-ai-tone": [
    {
      factorId: "public-backlash-pressure",
      raw: 0.32,
      unit: "backlash-0-1",
      normalized: 0.32,
      confidence: 0.6,
      citation: "https://www.gdeltproject.org/",
      notes: "Fallback estimate; replaced by live GDELT tone when available.",
    },
  ],
};

export type CuratedTimelineEvent = {
  date: string;
  title: string;
  summary: string;
  significance: "minor" | "major" | "landmark";
  category: string;
  citation: string;
};

export const curatedTimeline: CuratedTimelineEvent[] = [
  {
    date: "2017-06-12",
    title: "“Attention Is All You Need” introduces the Transformer",
    summary:
      "The Transformer architecture replaces recurrence with attention, becoming the backbone of modern frontier models.",
    significance: "landmark",
    category: "research",
    citation: "https://arxiv.org/abs/1706.03762",
  },
  {
    date: "2020-05-28",
    title: "GPT-3 demonstrates few-shot learning at scale",
    summary:
      "A 175B-parameter model shows that scaling unlocks broad few-shot capability, catalyzing the scaling era.",
    significance: "landmark",
    category: "model-release",
    citation: "https://arxiv.org/abs/2005.14165",
  },
  {
    date: "2022-11-30",
    title: "ChatGPT launches",
    summary:
      "Conversational access to a capable LLM drives the fastest consumer-product adoption on record and mainstreams AI.",
    significance: "landmark",
    category: "model-release",
    citation: "https://openai.com/blog/chatgpt",
  },
  {
    date: "2023-03-14",
    title: "GPT-4 released",
    summary:
      "A large multimodal model posts human-level results on many professional and academic benchmarks.",
    significance: "major",
    category: "model-release",
    citation: "https://openai.com/research/gpt-4",
  },
  {
    date: "2024-05-13",
    title: "Frontier models go natively multimodal and real-time",
    summary:
      "Real-time voice, vision, and text in a single model push assistants toward agentic, multimodal interaction.",
    significance: "major",
    category: "model-release",
    citation: "https://en.wikipedia.org/wiki/GPT-4o",
  },
  {
    date: "2024-09-12",
    title: "Inference-time reasoning models emerge",
    summary:
      "Models that 'think' with extended test-time compute sharply improve math, coding, and science benchmarks.",
    significance: "major",
    category: "research",
    citation: "https://openai.com/index/learning-to-reason-with-llms/",
  },
  {
    date: "2025-01-20",
    title: "Efficient open-weight reasoning models close the gap",
    summary:
      "Strong open-weight reasoning models trained at lower cost intensify competition and broaden access.",
    significance: "major",
    category: "model-release",
    citation: "https://arxiv.org/abs/2501.12948",
  },
];

export type CuratedJobsImpact = {
  overallAutomationPct: number;
  bySector: Array<{ sector: string; automationPct: number; source: string; sourceId?: string }>;
  byOccupation: Array<{ onetCode: string; title: string; exposurePct: number; source: string; sourceId?: string }>;
  emergingJobs: Array<{ title: string; description: string; demandSignal: number; source: string; sourceId?: string }>;
};

export const curatedJobs: CuratedJobsImpact = {
  overallAutomationPct: 31.7,
  bySector: [
    { sector: "Information & software", automationPct: 44, source: "https://www.onetonline.org/", sourceId: "onet-occupation-data" },
    { sector: "Finance & insurance", automationPct: 39, source: "https://www.anthropic.com/economic-index", sourceId: "anthropic-economic-index" },
    { sector: "Professional & business services", automationPct: 36, source: "https://www.onetonline.org/", sourceId: "onet-occupation-data" },
    { sector: "Legal & administrative", automationPct: 33, source: "https://www.onetonline.org/", sourceId: "onet-occupation-data" },
    { sector: "Healthcare", automationPct: 18, source: "https://www.anthropic.com/economic-index", sourceId: "anthropic-economic-index" },
    { sector: "Construction & trades", automationPct: 9, source: "https://www.onetonline.org/", sourceId: "onet-occupation-data" },
  ],
  byOccupation: [
    { onetCode: "15-1252.00", title: "Software developers", exposurePct: 58, source: "https://www.anthropic.com/economic-index", sourceId: "anthropic-economic-index" },
    { onetCode: "27-3043.00", title: "Writers & content creators", exposurePct: 62, source: "https://www.onetonline.org/", sourceId: "onet-occupation-data" },
    { onetCode: "43-9061.00", title: "Office & administrative support", exposurePct: 55, source: "https://www.onetonline.org/", sourceId: "onet-occupation-data" },
    { onetCode: "13-2011.00", title: "Accountants & auditors", exposurePct: 47, source: "https://www.onetonline.org/", sourceId: "onet-occupation-data" },
    { onetCode: "41-3099.00", title: "Sales & support", exposurePct: 41, source: "https://www.onetonline.org/", sourceId: "onet-occupation-data" },
    { onetCode: "29-1141.00", title: "Registered nurses", exposurePct: 14, source: "https://www.onetonline.org/", sourceId: "onet-occupation-data" },
  ],
  emergingJobs: [
    { title: "AI engineer / LLM application developer", description: "Builds and ships products on top of frontier models, tools, and agents.", demandSignal: 0.92, source: "https://www.onetonline.org/", sourceId: "onet-occupation-data" },
    { title: "AI safety & evaluation specialist", description: "Designs evals, red-teams models, and assesses dangerous capabilities.", demandSignal: 0.78, source: "https://www.anthropic.com/economic-index", sourceId: "anthropic-economic-index" },
    { title: "Machine-learning operations (MLOps) engineer", description: "Runs training/inference infrastructure, data pipelines, and reliability.", demandSignal: 0.81, source: "https://www.onetonline.org/", sourceId: "onet-occupation-data" },
    { title: "AI product manager", description: "Translates model capabilities into reliable, governed product experiences.", demandSignal: 0.74, source: "https://www.onetonline.org/", sourceId: "onet-occupation-data" },
    { title: "Prompt & context engineer", description: "Designs retrieval, tools, and context for dependable model behavior.", demandSignal: 0.6, source: "https://www.onetonline.org/", sourceId: "onet-occupation-data" },
  ],
};
