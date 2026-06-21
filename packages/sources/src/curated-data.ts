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
  "stanford-ai-index": [
    {
      factorId: "frontier-benchmark-saturation",
      raw: 0.76,
      unit: "saturation-0-1",
      normalized: 0.76,
      confidence: 0.82,
      citation: "https://aiindex.stanford.edu/report/",
      notes: "AI Index: rapid benchmark gains, many human baselines surpassed.",
    },
    {
      factorId: "algorithmic-efficiency",
      raw: 0.7,
      unit: "efficiency-momentum-0-1",
      normalized: 0.7,
      confidence: 0.74,
      citation: "https://aiindex.stanford.edu/report/",
      notes: "Inference cost for GPT-3.5-level capability fell sharply (AI Index).",
    },
  ],
  "arc-prize": [
    {
      factorId: "frontier-benchmark-saturation",
      raw: 0.55,
      unit: "arc-agi-momentum-0-1",
      normalized: 0.55,
      confidence: 0.78,
      citation: "https://arcprize.org/leaderboard",
      notes: "ARC-AGI remains hard but reasoning models made large jumps.",
    },
  ],
  "helm-crfm": [
    {
      factorId: "frontier-benchmark-saturation",
      raw: 0.72,
      unit: "helm-momentum-0-1",
      normalized: 0.72,
      confidence: 0.76,
      citation: "https://crfm.stanford.edu/helm/",
      notes: "HELM holistic leaderboards continue to climb at the frontier.",
    },
  ],
  "metr-autonomy": [
    {
      factorId: "autonomy-horizon",
      raw: 0.6,
      unit: "task-horizon-momentum-0-1",
      normalized: 0.6,
      confidence: 0.78,
      citation: "https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/",
      notes: "METR: the task length models can do autonomously is roughly doubling every ~7 months.",
    },
  ],
  "polymarket-ai": [
    {
      factorId: "forecast-consensus-anchor",
      raw: 0.58,
      unit: "market-optimism-0-1",
      normalized: 0.58,
      confidence: 0.66,
      citation: "https://polymarket.com/markets/ai",
      notes: "Curated read of AI-timeline prediction markets.",
    },
  ],
  "semantic-scholar": [
    {
      factorId: "research-velocity",
      raw: 0.64,
      unit: "citation-momentum-0-1",
      normalized: 0.64,
      confidence: 0.7,
      citation: "https://www.semanticscholar.org/",
      notes: "AI citation graph growth remains steep.",
    },
  ],
  "github-frontier": [
    {
      factorId: "research-velocity",
      raw: 0.66,
      unit: "repo-activity-momentum-0-1",
      normalized: 0.66,
      confidence: 0.66,
      citation: "https://github.com/topics/llm",
      notes: "Frontier-AI open-source activity and stars trending up.",
    },
  ],
  "iea-energy": [
    {
      factorId: "energy-headroom",
      raw: 0.47,
      unit: "constraint-0-1",
      normalized: 0.47,
      confidence: 0.74,
      citation: "https://www.iea.org/reports/electricity-2025",
      notes: "IEA projects datacenter electricity demand roughly doubling by 2030.",
    },
  ],
  "tsmc-capacity": [
    {
      factorId: "hardware-supply",
      raw: 0.7,
      unit: "capacity-momentum-0-1",
      normalized: 0.7,
      confidence: 0.78,
      citation: "https://investor.tsmc.com/english",
      notes: "TSMC expanding advanced-node and CoWoS packaging capacity for AI accelerators.",
    },
  ],
  "bis-export-controls": [
    {
      factorId: "export-control-friction",
      raw: 0.5,
      unit: "friction-0-1",
      normalized: 0.5,
      confidence: 0.7,
      citation: "https://www.bis.gov/",
      notes: "Tightening US chip export controls add friction to global scaling.",
    },
  ],
  "eu-ai-act": [
    {
      factorId: "policy-friction",
      raw: 0.42,
      unit: "friction-0-1",
      normalized: 0.42,
      confidence: 0.72,
      citation: "https://artificialintelligenceact.eu/",
      notes: "EU AI Act obligations phasing in through 2025-2027.",
    },
  ],
  "fred-macro": [
    {
      factorId: "datacenter-capex",
      raw: 0.6,
      unit: "capital-conditions-0-1",
      normalized: 0.6,
      confidence: 0.64,
      citation: "https://fred.stlouisfed.org/",
      notes: "Financing conditions supportive of continued AI capex.",
    },
  ],
  "pew-ai-sentiment": [
    {
      factorId: "public-backlash-pressure",
      raw: 0.4,
      unit: "concern-0-1",
      normalized: 0.4,
      confidence: 0.7,
      citation: "https://www.pewresearch.org/topic/science/science-issues/artificial-intelligence/",
      notes: "Public is more concerned than excited about AI in recent polling.",
    },
  ],
  "uk-aisi-evals": [
    {
      factorId: "safety-eval-pressure",
      raw: 0.45,
      unit: "gating-0-1",
      normalized: 0.45,
      confidence: 0.68,
      citation: "https://www.aisi.gov.uk/",
      notes: "Pre-deployment safety evaluations add modest release friction.",
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
    date: "2020-11-30",
    title: "AlphaFold 2 solves protein structure prediction",
    summary:
      "DeepMind's system reaches near-experimental accuracy at CASP14 — a landmark for AI in science.",
    significance: "major",
    category: "research",
    citation:
      "https://deepmind.google/discover/blog/alphafold-a-solution-to-a-50-year-old-grand-challenge-in-biology/",
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
    date: "2023-02-24",
    title: "Meta releases LLaMA, igniting open-weight models",
    summary:
      "Capable open-weight models spread rapidly, seeding a fast-moving open ecosystem.",
    significance: "major",
    category: "model-release",
    citation: "https://arxiv.org/abs/2302.13971",
  },
  {
    date: "2023-03-14",
    title: "GPT-4 released",
    summary:
      "A large multimodal model posts human-level results on many professional and academic benchmarks.",
    significance: "landmark",
    category: "model-release",
    citation: "https://openai.com/research/gpt-4",
  },
  {
    date: "2023-11-02",
    title: "First global AI Safety Summit (Bletchley)",
    summary:
      "28 nations sign the Bletchley Declaration on frontier-AI risk — governance enters the picture.",
    significance: "major",
    category: "policy",
    citation: "https://en.wikipedia.org/wiki/AI_Safety_Summit",
  },
  {
    date: "2023-12-06",
    title: "Google launches Gemini",
    summary:
      "A natively multimodal frontier family intensifies competition at the top.",
    significance: "major",
    category: "model-release",
    citation: "https://blog.google/technology/ai/google-gemini-ai/",
  },
  {
    date: "2024-02-15",
    title: "Gemini 1.5 brings million-token context",
    summary:
      "Long-context models make whole-codebase and long-document reasoning practical.",
    significance: "major",
    category: "model-release",
    citation:
      "https://blog.google/technology/ai/google-gemini-next-generation-model-february-2024/",
  },
  {
    date: "2024-03-04",
    title: "Anthropic releases the Claude 3 family",
    summary:
      "Claude 3 Opus matches or exceeds peers across reasoning, coding, and vision benchmarks.",
    significance: "major",
    category: "model-release",
    citation: "https://www.anthropic.com/news/claude-3-family",
  },
  {
    date: "2024-04-18",
    title: "Meta releases Llama 3",
    summary:
      "Stronger open-weight models narrow the gap to closed frontier systems.",
    significance: "major",
    category: "model-release",
    citation: "https://ai.meta.com/blog/meta-llama-3/",
  },
  {
    date: "2024-05-13",
    title: "GPT-4o makes frontier models real-time multimodal",
    summary:
      "Native voice, vision, and text in one model push assistants toward agentic, real-time interaction.",
    significance: "major",
    category: "model-release",
    citation: "https://openai.com/index/hello-gpt-4o/",
  },
  {
    date: "2024-08-01",
    title: "EU AI Act enters into force",
    summary:
      "The first comprehensive AI law begins phasing in obligations for frontier systems through 2027.",
    significance: "major",
    category: "policy",
    citation: "https://artificialintelligenceact.eu/",
  },
  {
    date: "2024-09-12",
    title: "OpenAI o1 — inference-time reasoning",
    summary:
      "Models that 'think' with extended test-time compute sharply improve math, coding, and science.",
    significance: "landmark",
    category: "research",
    citation: "https://openai.com/index/learning-to-reason-with-llms/",
  },
  {
    date: "2024-12-20",
    title: "o3 posts a breakthrough on ARC-AGI",
    summary:
      "A reasoning model leaps on the ARC-AGI abstraction benchmark, reopening debate on how close AGI is.",
    significance: "landmark",
    category: "benchmark",
    citation: "https://arcprize.org/blog/oai-o3-pub-breakthrough",
  },
  {
    date: "2025-01-20",
    title: "DeepSeek-R1: efficient open-weight reasoning",
    summary:
      "A strong reasoning model trained at far lower cost intensifies competition and broadens access.",
    significance: "landmark",
    category: "model-release",
    citation: "https://arxiv.org/abs/2501.12948",
  },
  {
    date: "2025-01-21",
    title: "The Stargate Project announces massive AI buildout",
    summary:
      "A multi-hundred-billion-dollar US compute-infrastructure effort signals the scale of the buildout.",
    significance: "major",
    category: "infrastructure",
    citation: "https://openai.com/index/announcing-the-stargate-project/",
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
