import type { AgiDefinitionId } from "@agi-countdown/config";

/**
 * Curated, real, cited reference data.
 *
 * These are hand-maintained values drawn from published forecasts, reports, and
 * datasets. They are deliberately conservative and carry a real citation so the
 * UI can attribute every number. Live connectors (Manifold / arXiv / GDELT /
 * GitHub / Hugging Face)
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
  "ai-index-investment": [
    {
      factorId: "capital-formation",
      raw: 0.71,
      unit: "investment-momentum-0-1",
      normalized: 0.71,
      confidence: 0.74,
      citation: "https://hai.stanford.edu/ai-index/2025-ai-index-report",
      notes: "Global private AI investment is at record highs, led by generative-AI funding (AI Index).",
    },
  ],
  "macro-risk-index": [
    {
      factorId: "macro-headwinds",
      raw: 0.35,
      unit: "risk-0-1",
      normalized: 0.35,
      confidence: 0.6,
      citation: "https://fred.stlouisfed.org/series/RECPROUSM156N",
      notes: "Near-term recession probability is low-to-moderate; AI-bubble concerns add some downside risk.",
    },
  ],
  "ifr-world-robotics": [
    {
      factorId: "robotics-embodiment",
      raw: 0.48,
      unit: "embodiment-momentum-0-1",
      normalized: 0.48,
      confidence: 0.6,
      citation: "https://ifr.org/worldrobotics/",
      notes: "Industrial-robot installs near record highs; humanoid/embodied progress accelerating but still early.",
    },
  ],
  "epoch-data-wall": [
    {
      factorId: "data-availability",
      raw: 0.5,
      unit: "constraint-0-1",
      normalized: 0.5,
      confidence: 0.62,
      citation: "https://epoch.ai/blog/will-we-run-out-of-data-limits-of-llm-scaling-based-on-human-generated-data",
      notes: "Epoch projects the stock of high-quality public text is used up ~2026-2032; synthetic/multimodal data partly offsets, so a moderate constraint.",
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
  {
    date: "2025-02-24",
    title: "Anthropic releases Claude 3.7 Sonnet (hybrid reasoning)",
    summary:
      "A model that can answer instantly or think step-by-step blends fast and deliberate reasoning.",
    significance: "major",
    category: "model-release",
    citation: "https://www.anthropic.com/news/claude-3-7-sonnet",
  },
  {
    date: "2025-02-27",
    title: "OpenAI releases GPT-4.5",
    summary:
      "The largest GPT-series model to date pushes breadth of knowledge and reduced hallucination.",
    significance: "major",
    category: "model-release",
    citation: "https://openai.com/index/introducing-gpt-4-5/",
  },
  {
    date: "2025-03-25",
    title: "Google launches Gemini 2.5 Pro",
    summary:
      "A 'thinking' frontier model tops reasoning and coding leaderboards with long context.",
    significance: "major",
    category: "model-release",
    citation:
      "https://blog.google/technology/google-deepmind/gemini-model-thinking-updates-march-2025/",
  },
  {
    date: "2025-04-05",
    title: "Meta releases Llama 4 (mixture-of-experts, multimodal)",
    summary:
      "Open-weight MoE models with very long context keep the open ecosystem near the frontier.",
    significance: "major",
    category: "model-release",
    citation: "https://ai.meta.com/blog/llama-4-multimodal-intelligence/",
  },
  {
    date: "2025-04-16",
    title: "OpenAI o3 and o4-mini bring tool-using reasoning",
    summary:
      "Reasoning models that fluently use tools (browsing, code, vision) advance agentic capability.",
    significance: "major",
    category: "model-release",
    citation: "https://openai.com/index/introducing-o3-and-o4-mini/",
  },
  {
    date: "2025-05-22",
    title: "Anthropic releases Claude 4 (Opus 4 & Sonnet 4)",
    summary:
      "Frontier coding and long-horizon agentic performance step up with the Claude 4 family.",
    significance: "landmark",
    category: "model-release",
    citation: "https://www.anthropic.com/news/claude-4",
  },
  {
    date: "2025-08-07",
    title: "OpenAI releases GPT-5",
    summary:
      "A unified flagship system routes between fast and deep reasoning across the product surface.",
    significance: "landmark",
    category: "model-release",
    citation: "https://openai.com/index/introducing-gpt-5/",
  },
  {
    date: "2025-12-11",
    title: "OpenAI releases GPT-5.2",
    summary:
      "Instant, Thinking, and Pro tiers sharpen reasoning, coding, and long-document work across the GPT-5 line.",
    significance: "major",
    category: "model-release",
    citation: "https://openai.com/index/introducing-gpt-5-2/",
  },
  {
    date: "2026-02-05",
    title: "Anthropic releases Claude Opus 4.6",
    summary:
      "A 1M-token context (beta), agent teams in Claude Code, and adaptive effort controls extend long-horizon work.",
    significance: "major",
    category: "model-release",
    citation: "https://www.anthropic.com/news/claude-opus-4-6",
  },
  {
    date: "2026-04-16",
    title: "Anthropic releases Claude Opus 4.7",
    summary:
      "Higher coding and agent scores (+10.9 on SWE-bench Pro vs 4.6), file-system memory, and a new xhigh reasoning tier.",
    significance: "major",
    category: "model-release",
    citation: "https://www.anthropic.com/news/claude-opus-4-7",
  },
  {
    date: "2026-04-23",
    title: "OpenAI releases GPT-5.5",
    summary:
      "The latest GPT-5-series flagship raises the bar on reasoning, coding, and agentic tasks.",
    significance: "major",
    category: "model-release",
    citation: "https://openai.com/index/introducing-gpt-5-5/",
  },
  {
    date: "2026-05-04",
    title: "Anthropic and OpenAI launch enterprise AI deployment ventures",
    summary:
      "Both labs spin up services arms — OpenAI's Deployment Co. and Anthropic's PE-backed joint venture — to drive enterprise adoption.",
    significance: "major",
    category: "industry",
    citation:
      "https://techcrunch.com/2026/05/04/anthropic-and-openai-are-both-launching-joint-ventures-for-enterprise-ai-services/",
  },
  {
    date: "2026-05-28",
    title: "Anthropic releases Claude Opus 4.8",
    summary:
      "Gains in honesty, coding, and agentic work, plus dynamic workflows; Mythos-class models enter preview under Project Glasswing.",
    significance: "major",
    category: "model-release",
    citation: "https://www.anthropic.com/news/claude-opus-4-8",
  },
  {
    date: "2026-06-09",
    title: "Anthropic releases Claude Fable 5 and Mythos 5",
    summary:
      "Fable 5 reaches state-of-the-art on nearly all benchmarks with new high-risk safeguards; Mythos 5 ships in limited Project Glasswing access.",
    significance: "landmark",
    category: "model-release",
    citation: "https://www.anthropic.com/news/claude-fable-5-mythos-5",
  },
];

export type CuratedJobsImpact = {
  overallAutomationPct: number;
  // "Revenue at risk" — the scale of economic value exposed to AI automation.
  // Curated from published macro estimates; an estimate of exposure, not lost GDP.
  revenueAtRisk: {
    annualValueUsdTn: number;
    exposedRevenueSharePct: number;
    description: string;
    source: string;
    sourceId?: string;
  };
  // Automation exposure and revenue-at-risk vary sharply by region (advanced vs
  // emerging economies). Curated from IMF / ILO regional analyses.
  regions: Array<{
    region: string;
    automationExposurePct: number;
    revenueAtRiskPct: number;
    note: string;
    source: string;
    sourceId?: string;
  }>;
  sectors: Array<{
    sector: string;
    workforceSharePct: number;
    automationExposurePct: number;
    revenueAtRiskPct: number;
    source: string;
    sourceId?: string;
    emergingRoles: Array<{ title: string; demandSignal: number }>;
    decliningRoles: string[];
  }>;
  highlights: Array<{ title: string; description: string; demandSignal: number; source: string; sourceId?: string }>;
};

const ONET = "https://www.onetonline.org/";
const BLS = "https://www.bls.gov/oes/";
const AEI = "https://www.anthropic.com/economic-index";
const IMF = "https://www.imf.org/en/Blogs/Articles/2024/01/14/ai-will-transform-the-global-economy-lets-make-sure-it-benefits-humanity";
const ILO = "https://www.ilo.org/publications/generative-ai-and-jobs-global-analysis-potential-effects-job-quantity-and";
const MCKINSEY = "https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/the-economic-potential-of-generative-ai-the-next-productivity-frontier";

// Workforce shares approximate US employment distribution (BLS); automation
// exposure is a curated read of task-level AI exposure (Anthropic Economic
// Index, OpenAI "GPTs are GPTs", OECD). Shares are normalized to ~100%.
export const curatedJobs: CuratedJobsImpact = {
  overallAutomationPct: 31.7,
  revenueAtRisk: {
    annualValueUsdTn: 4.4,
    exposedRevenueSharePct: 24,
    description:
      "Generative AI could automate activities worth up to ~$4.4T in annual productivity value, with roughly a quarter of all work tasks exposed to acceleration. An estimate of value at stake — not GDP that vanishes.",
    source: MCKINSEY,
    sourceId: "mckinsey-genai",
  },
  regions: [
    {
      region: "North America",
      automationExposurePct: 60,
      revenueAtRiskPct: 30,
      note: "Advanced economy — ~60% of jobs exposed; high white-collar / knowledge-work share.",
      source: IMF,
      sourceId: "imf-ai-economy",
    },
    {
      region: "Europe",
      automationExposurePct: 58,
      revenueAtRiskPct: 28,
      note: "Advanced economies with strong services exposure; AI Act adds governance friction.",
      source: IMF,
      sourceId: "imf-ai-economy",
    },
    {
      region: "East Asia",
      automationExposurePct: 50,
      revenueAtRiskPct: 24,
      note: "Mixed advanced/emerging; large manufacturing plus a fast-growing AI/tech base.",
      source: ILO,
      sourceId: "ilo-genai-jobs",
    },
    {
      region: "Latin America",
      automationExposurePct: 40,
      revenueAtRiskPct: 16,
      note: "Emerging markets ~40% exposure; lower deployment penetration so far.",
      source: IMF,
      sourceId: "imf-ai-economy",
    },
    {
      region: "South & Southeast Asia",
      automationExposurePct: 35,
      revenueAtRiskPct: 14,
      note: "Heavy IT-services exposure, but lower overall automation reach near-term.",
      source: ILO,
      sourceId: "ilo-genai-jobs",
    },
    {
      region: "Middle East & Africa",
      automationExposurePct: 28,
      revenueAtRiskPct: 10,
      note: "Lower-income economies ~26% exposure; infrastructure and access are the gating factors.",
      source: IMF,
      sourceId: "imf-ai-economy",
    },
  ],
  sectors: [
    {
      sector: "Information & software",
      workforceSharePct: 3,
      automationExposurePct: 52,
      revenueAtRiskPct: 34,
      source: AEI,
      sourceId: "anthropic-economic-index",
      emergingRoles: [
        { title: "AI engineer / LLM app developer", demandSignal: 0.93 },
        { title: "MLOps & inference platform engineer", demandSignal: 0.82 },
        { title: "AI product manager", demandSignal: 0.75 },
      ],
      decliningRoles: ["Routine QA testing", "Boilerplate coding", "Tier-1 IT support"],
    },
    {
      sector: "Professional & business services",
      workforceSharePct: 14,
      automationExposurePct: 41,
      revenueAtRiskPct: 28,
      source: ONET,
      sourceId: "onet-occupation-data",
      emergingRoles: [
        { title: "AI governance & compliance officer", demandSignal: 0.78 },
        { title: "Process-automation analyst", demandSignal: 0.7 },
        { title: "AI-augmented consultant", demandSignal: 0.66 },
      ],
      decliningRoles: ["Data entry", "Basic bookkeeping", "Research assistants"],
    },
    {
      sector: "Financial activities",
      workforceSharePct: 6,
      automationExposurePct: 40,
      revenueAtRiskPct: 30,
      source: AEI,
      sourceId: "anthropic-economic-index",
      emergingRoles: [
        { title: "AI model-risk & validation analyst", demandSignal: 0.74 },
        { title: "Algorithmic-fraud investigator", demandSignal: 0.68 },
        { title: "AI-augmented financial advisor", demandSignal: 0.62 },
      ],
      decliningRoles: ["Loan processing clerks", "Manual underwriting", "Routine accounting"],
    },
    {
      sector: "Government & public sector",
      workforceSharePct: 15,
      automationExposurePct: 28,
      revenueAtRiskPct: 12,
      source: BLS,
      sourceId: "bls-oes",
      emergingRoles: [
        { title: "Public-sector AI policy analyst", demandSignal: 0.6 },
        { title: "AI service-delivery designer", demandSignal: 0.55 },
      ],
      decliningRoles: ["Form processing", "Records clerks"],
    },
    {
      sector: "Education",
      workforceSharePct: 9,
      automationExposurePct: 32,
      revenueAtRiskPct: 14,
      source: ONET,
      sourceId: "onet-occupation-data",
      emergingRoles: [
        { title: "AI tutoring & curriculum designer", demandSignal: 0.64 },
        { title: "AI-literacy educator", demandSignal: 0.58 },
      ],
      decliningRoles: ["Manual grading", "Basic content creation"],
    },
    {
      sector: "Healthcare & social assistance",
      workforceSharePct: 14,
      automationExposurePct: 20,
      revenueAtRiskPct: 12,
      source: AEI,
      sourceId: "anthropic-economic-index",
      emergingRoles: [
        { title: "Clinical AI integration specialist", demandSignal: 0.7 },
        { title: "AI-assisted diagnostics technician", demandSignal: 0.6 },
        { title: "Health-data governance lead", demandSignal: 0.57 },
      ],
      decliningRoles: ["Medical transcription", "Some radiology screening", "Scheduling clerks"],
    },
    {
      sector: "Retail & wholesale trade",
      workforceSharePct: 13,
      automationExposurePct: 24,
      revenueAtRiskPct: 16,
      source: ONET,
      sourceId: "onet-occupation-data",
      emergingRoles: [
        { title: "AI merchandising analyst", demandSignal: 0.55 },
        { title: "Conversational-commerce manager", demandSignal: 0.52 },
      ],
      decliningRoles: ["Cashiers", "Call-center agents", "Inventory clerks"],
    },
    {
      sector: "Manufacturing",
      workforceSharePct: 8,
      automationExposurePct: 25,
      revenueAtRiskPct: 15,
      source: BLS,
      sourceId: "bls-oes",
      emergingRoles: [
        { title: "Robotics / industrial-AI technician", demandSignal: 0.63 },
        { title: "AI operations / predictive-maintenance lead", demandSignal: 0.58 },
      ],
      decliningRoles: ["Repetitive assembly", "Manual inspection"],
    },
    {
      sector: "Transportation & logistics",
      workforceSharePct: 6,
      automationExposurePct: 22,
      revenueAtRiskPct: 14,
      source: BLS,
      sourceId: "bls-oes",
      emergingRoles: [
        { title: "Autonomy operations supervisor", demandSignal: 0.56 },
        { title: "AI logistics optimization analyst", demandSignal: 0.54 },
      ],
      decliningRoles: ["Routing clerks", "Some long-haul driving (longer term)"],
    },
    {
      sector: "Leisure & hospitality",
      workforceSharePct: 7,
      automationExposurePct: 13,
      revenueAtRiskPct: 7,
      source: ONET,
      sourceId: "onet-occupation-data",
      emergingRoles: [{ title: "AI guest-experience designer", demandSignal: 0.45 }],
      decliningRoles: ["Reservation agents", "Basic concierge"],
    },
    {
      sector: "Construction & trades",
      workforceSharePct: 5,
      automationExposurePct: 9,
      revenueAtRiskPct: 5,
      source: ONET,
      sourceId: "onet-occupation-data",
      emergingRoles: [{ title: "AI estimating & planning specialist", demandSignal: 0.42 }],
      decliningRoles: ["Manual estimating", "Drafting (partially)"],
    },
  ],
  highlights: [
    { title: "AI engineer / LLM application developer", description: "Builds and ships products on frontier models, tools, and agents — the fastest-growing AI role across every sector.", demandSignal: 0.93, source: ONET, sourceId: "onet-occupation-data" },
    { title: "AI safety & evaluation specialist", description: "Designs evals, red-teams models, and assesses dangerous capabilities for labs and enterprises.", demandSignal: 0.78, source: AEI, sourceId: "anthropic-economic-index" },
    { title: "AI governance & compliance officer", description: "Owns responsible-AI policy, audits, and regulatory compliance (EU AI Act and beyond).", demandSignal: 0.76, source: ONET, sourceId: "onet-occupation-data" },
  ],
};
