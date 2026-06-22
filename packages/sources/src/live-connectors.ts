import type { SourceDef } from "@agi-countdown/config";
import type {
  ConnectorContext,
  ConnectorResult,
  FactorSample,
  FreeStructuredConnector,
} from "./types.js";

const DEFAULT_TIMEOUT_MS = 12_000;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { "user-agent": "agi-countdown-pipeline/1.0", ...(init?.headers ?? {}) },
    });
  } finally {
    clearTimeout(timer);
  }
}

function sample(
  partial: Omit<FactorSample, "observedAt" | "collectedAt" | "quarantined"> &
    Partial<Pick<FactorSample, "quarantined">>,
  now: Date,
): FactorSample {
  const iso = now.toISOString();
  return {
    observedAt: iso,
    collectedAt: iso,
    quarantined: false,
    ...partial,
  };
}

/**
 * Manifold — live AGI market optimism (no auth required).
 * Averages the implied probability of AGI-related binary markets into a 0..1
 * "market optimism" signal that nudges the forecast anchor's market component.
 */
export const manifoldConnector: FreeStructuredConnector = {
  parser: "manifold",
  mode: "free-structured",
  rateLimitKey: "manifold",
  supports: (source) => source.parser === "manifold",
  async fetch(source: SourceDef, context: ConnectorContext): Promise<ConnectorResult> {
    const fetchedAt = context.now.toISOString();
    try {
      const response = await fetchWithTimeout(
        "https://api.manifold.markets/v0/search-markets?term=AGI&limit=40&sort=most-popular",
      );
      if (!response.ok) {
        throw new Error(`Manifold responded ${response.status}`);
      }
      const markets = (await response.json()) as Array<{
        outcomeType?: string;
        probability?: number;
        volume?: number;
      }>;
      const probs = markets
        .filter((m) => m.outcomeType === "BINARY" && typeof m.probability === "number")
        .map((m) => m.probability as number);

      if (probs.length === 0) {
        throw new Error("Manifold returned no binary AGI markets");
      }

      const optimism = clamp01(probs.reduce((a, b) => a + b, 0) / probs.length);
      return {
        sourceId: source.id,
        fetchedAt,
        warnings: [],
        samples: [
          sample(
            {
              factorId: "forecast-consensus-anchor",
              sourceId: source.id,
              raw: optimism,
              unit: "market-optimism-0-1",
              normalized: optimism,
              confidence: 0.7,
              citation: "https://manifold.markets/search?term=AGI",
              notes: `Mean implied probability across ${probs.length} AGI markets (live).`,
            },
            context.now,
          ),
        ],
      };
    } catch (error) {
      return {
        sourceId: source.id,
        fetchedAt,
        samples: [],
        warnings: [`Manifold live fetch failed: ${describeError(error)}`],
      };
    }
  },
};

/**
 * arXiv — live research velocity. Compares cs.AI submissions in the last 14 days
 * against the prior 14 days to produce a 0..1 momentum signal.
 */
export const arxivConnector: FreeStructuredConnector = {
  parser: "arxiv",
  mode: "free-structured",
  rateLimitKey: "arxiv",
  supports: (source) => source.parser === "arxiv",
  async fetch(source: SourceDef, context: ConnectorContext): Promise<ConnectorResult> {
    const fetchedAt = context.now.toISOString();
    try {
      const now = context.now.getTime();
      const day = 86_400_000;
      const recent = await arxivCount(now - 14 * day, now);
      const prior = await arxivCount(now - 28 * day, now - 14 * day);

      if (recent + prior === 0) {
        throw new Error("arXiv returned zero results for both windows");
      }

      // Momentum: share of the last 4 weeks that fell in the most recent 2 weeks.
      const momentum = clamp01(recent / (recent + prior));
      return {
        sourceId: source.id,
        fetchedAt,
        warnings: [],
        samples: [
          sample(
            {
              factorId: "research-velocity",
              sourceId: source.id,
              raw: recent,
              unit: "cs.AI-submissions-14d",
              normalized: momentum,
              confidence: 0.7,
              citation: "https://arxiv.org/list/cs.AI/recent",
              notes: `cs.AI submissions: ${recent} (last 14d) vs ${prior} (prior 14d).`,
            },
            context.now,
          ),
        ],
      };
    } catch (error) {
      return {
        sourceId: source.id,
        fetchedAt,
        samples: [],
        warnings: [`arXiv live fetch failed: ${describeError(error)}`],
      };
    }
  },
};

async function arxivCount(fromMs: number, toMs: number): Promise<number> {
  const stamp = (ms: number) => {
    const d = new Date(ms);
    const p = (n: number) => n.toString().padStart(2, "0");
    return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}`;
  };
  const query = `cat:cs.AI+AND+submittedDate:[${stamp(fromMs)}+TO+${stamp(toMs)}]`;
  const url = `https://export.arxiv.org/api/query?search_query=${query}&max_results=1`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`arXiv responded ${response.status}`);
  }
  const xml = await response.text();
  const match = xml.match(/<opensearch:totalResults[^>]*>(\d+)<\/opensearch:totalResults>/);
  return match ? Number.parseInt(match[1] ?? "0", 10) : 0;
}

/**
 * GDELT — live public sentiment / backlash. Uses the timelinetone API for AI
 * coverage; negative average tone maps to higher backlash pressure (0..1).
 */
export const gdeltConnector: FreeStructuredConnector = {
  parser: "gdelt",
  mode: "free-structured",
  rateLimitKey: "gdelt",
  supports: (source) => source.parser === "gdelt",
  async fetch(source: SourceDef, context: ConnectorContext): Promise<ConnectorResult> {
    const fetchedAt = context.now.toISOString();
    try {
      const url =
        "https://api.gdeltproject.org/api/v2/doc/doc?query=" +
        encodeURIComponent('"artificial intelligence"') +
        "&mode=timelinetone&timespan=14d&format=json";
      const response = await fetchWithTimeout(url);
      if (!response.ok) {
        throw new Error(`GDELT responded ${response.status}`);
      }
      const payload = (await response.json()) as {
        timeline?: Array<{ data?: Array<{ value?: number }> }>;
      };
      const points = payload.timeline?.[0]?.data ?? [];
      const tones = points
        .map((p) => p.value)
        .filter((v): v is number => typeof v === "number");

      if (tones.length === 0) {
        throw new Error("GDELT returned no tone points");
      }

      const avgTone = tones.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, tones.length);
      // Tone ~ [-10, +10]; more negative => more backlash.
      const backlash = clamp01(0.5 - avgTone / 12);
      return {
        sourceId: source.id,
        fetchedAt,
        warnings: [],
        samples: [
          sample(
            {
              factorId: "public-backlash-pressure",
              sourceId: source.id,
              raw: Number(avgTone.toFixed(3)),
              unit: "avg-tone",
              normalized: backlash,
              confidence: 0.65,
              citation: "https://www.gdeltproject.org/",
              notes: `Mean GDELT tone for AI coverage over ~14d: ${avgTone.toFixed(2)}.`,
            },
            context.now,
          ),
        ],
      };
    } catch (error) {
      return {
        sourceId: source.id,
        fetchedAt,
        samples: [],
        warnings: [`GDELT live fetch failed: ${describeError(error)}`],
      };
    }
  },
};

/**
 * GitHub — live research/engineering velocity. Compares the count of new
 * `topic:llm` repositories created in the last 30 days against the prior 30 days
 * to produce a 0..1 momentum signal (no auth; search API).
 */
export const githubConnector: FreeStructuredConnector = {
  parser: "github",
  mode: "free-structured",
  rateLimitKey: "github",
  supports: (source) => source.parser === "github",
  async fetch(source: SourceDef, context: ConnectorContext): Promise<ConnectorResult> {
    const fetchedAt = context.now.toISOString();
    try {
      const day = 86_400_000;
      const now = context.now.getTime();
      const recent = await githubRepoCount(now - 30 * day, now);
      const prior = await githubRepoCount(now - 60 * day, now - 30 * day);
      if (recent + prior === 0) {
        throw new Error("GitHub returned zero repos for both windows");
      }
      const momentum = clamp01(recent / (recent + prior));
      return {
        sourceId: source.id,
        fetchedAt,
        warnings: [],
        samples: [
          sample(
            {
              factorId: "research-velocity",
              sourceId: source.id,
              raw: recent,
              unit: "new-llm-repos-30d",
              normalized: momentum,
              confidence: 0.62,
              citation: "https://github.com/topics/llm",
              notes: `New topic:llm repos: ${recent} (last 30d) vs ${prior} (prior 30d).`,
            },
            context.now,
          ),
        ],
      };
    } catch (error) {
      return {
        sourceId: source.id,
        fetchedAt,
        samples: [],
        warnings: [`GitHub live fetch failed: ${describeError(error)}`],
      };
    }
  },
};

async function githubRepoCount(fromMs: number, toMs: number): Promise<number> {
  const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  const query = encodeURIComponent(`topic:llm created:${day(fromMs)}..${day(toMs)}`);
  const url = `https://api.github.com/search/repositories?q=${query}&per_page=1`;
  const response = await fetchWithTimeout(url, { headers: { accept: "application/vnd.github+json" } });
  if (!response.ok) {
    throw new Error(`GitHub responded ${response.status}`);
  }
  const payload = (await response.json()) as { total_count?: number };
  return typeof payload.total_count === "number" ? payload.total_count : 0;
}

/**
 * Hugging Face Hub — live adoption proxy. Sums recent downloads across the top
 * text-generation models and maps to 0..1 with a saturating log scale (rolling
 * normalization relativizes the absolute level over time). No auth.
 */
export const huggingFaceConnector: FreeStructuredConnector = {
  parser: "hugging-face",
  mode: "free-structured",
  rateLimitKey: "hugging-face",
  supports: (source) => source.parser === "hugging-face",
  async fetch(source: SourceDef, context: ConnectorContext): Promise<ConnectorResult> {
    const fetchedAt = context.now.toISOString();
    try {
      const url =
        "https://huggingface.co/api/models?sort=downloads&direction=-1&limit=20&filter=text-generation";
      const response = await fetchWithTimeout(url);
      if (!response.ok) {
        throw new Error(`Hugging Face responded ${response.status}`);
      }
      const models = (await response.json()) as Array<{ downloads?: number }>;
      const total = models.reduce(
        (sum, model) => sum + (typeof model.downloads === "number" ? model.downloads : 0),
        0,
      );
      if (total <= 0) {
        throw new Error("Hugging Face returned no downloads");
      }
      // ~1e9 monthly downloads across the top models reads as ~1.0.
      const normalized = clamp01(Math.log10(total) / 9);
      return {
        sourceId: source.id,
        fetchedAt,
        warnings: [],
        samples: [
          sample(
            {
              factorId: "adoption-usage",
              sourceId: source.id,
              raw: total,
              unit: "top20-text-gen-downloads-30d",
              normalized,
              confidence: 0.6,
              citation: "https://huggingface.co/models",
              notes: `Sum of recent downloads across the top-20 text-generation models: ${total.toLocaleString()}.`,
            },
            context.now,
          ),
        ],
      };
    } catch (error) {
      return {
        sourceId: source.id,
        fetchedAt,
        samples: [],
        warnings: [`Hugging Face live fetch failed: ${describeError(error)}`],
      };
    }
  },
};

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export const liveConnectors: readonly FreeStructuredConnector[] = [
  manifoldConnector,
  arxivConnector,
  gdeltConnector,
  githubConnector,
  huggingFaceConnector,
];
