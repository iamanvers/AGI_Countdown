/**
 * Live AI news feed (GDELT) — genuinely current developments, refreshed each run.
 * The curated timeline holds historical milestones; this provides the present.
 * Each item is tagged with the frontier labs / orgs it mentions (deterministic
 * keyword detection, no LLM).
 */

export type NewsItem = {
  title: string;
  url: string;
  source: string; // publishing domain
  publishedAt: string; // ISO
  orgs: string[]; // detected frontier labs / orgs
};

/** Detected org -> the keywords that map to it (case-insensitive, word-ish). */
const ORG_KEYWORDS: Record<string, string[]> = {
  OpenAI: ["openai", "chatgpt", "gpt-5", "gpt-4", "sora", "o3", "o4"],
  Anthropic: ["anthropic", "claude", "fable"],
  "Google DeepMind": ["google deepmind", "deepmind", "gemini", "google ai"],
  Meta: ["meta ai", "llama", "fair "],
  NVIDIA: ["nvidia", "blackwell", "cuda", "gpu"],
  xAI: ["xai", "grok"],
  Microsoft: ["microsoft", "copilot", "azure ai"],
  DeepSeek: ["deepseek"],
  Mistral: ["mistral"],
  Alibaba: ["qwen", "alibaba"],
  Amazon: ["amazon", "aws", "bedrock"],
  Oracle: ["oracle"],
  Apple: ["apple intelligence", "apple ai"],
  TSMC: ["tsmc"],
  "Hugging Face": ["hugging face", "huggingface"]
};

function detectOrgs(title: string): string[] {
  const haystack = ` ${title.toLowerCase()} `;
  const hits: string[] = [];
  for (const [org, keywords] of Object.entries(ORG_KEYWORDS)) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      hits.push(org);
    }
  }
  return hits;
}

function parseSeenDate(value: string): string {
  // GDELT format: 20260622T120000Z
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!match) {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : new Date().toISOString();
  }
  const [, y, mo, d, h, mi, s] = match;
  return `${y}-${mo}-${d}T${h}:${mi}:${s}.000Z`;
}

async function fetchJson(url: string, timeoutMs = 15_000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "agi-countdown-pipeline/1.0" }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function dedupeAndTake(items: NewsItem[], limit: number): NewsItem[] {
  const seen = new Set<string>();
  const out: NewsItem[] = [];
  for (const item of items) {
    const key = item.title.toLowerCase().slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}

// Algolia does not treat "OR" as boolean, so we run several targeted queries
// and merge. These cover the field broadly while staying AI-relevant.
const HN_QUERIES = [
  "artificial intelligence",
  "OpenAI",
  "Anthropic",
  "large language model",
  "AGI",
  "Nvidia AI"
];

/** Primary live feed: Hacker News (Algolia) — reliable, free, genuinely current. */
async function fetchHackerNews(limit: number): Promise<NewsItem[]> {
  const perQuery = Math.max(8, Math.ceil(limit / 2));
  const results = await Promise.all(
    HN_QUERIES.map(async (query) => {
      try {
        const url =
          `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(query)}` +
          `&tags=story&numericFilters=points%3E4&hitsPerPage=${perQuery}`;
        const payload = (await fetchJson(url)) as {
          hits?: Array<{ title?: string; url?: string | null; created_at?: string; objectID?: string }>;
        };
        return payload.hits ?? [];
      } catch {
        return [];
      }
    })
  );

  return results.flat().flatMap((hit): NewsItem[] => {
    const title = hit.title?.trim();
    if (!title) return [];
    const link =
      hit.url && hit.url.startsWith("http")
        ? hit.url
        : `https://news.ycombinator.com/item?id=${hit.objectID}`;
    let source = "news.ycombinator.com";
    try {
      source = new URL(link).hostname.replace(/^www\./, "");
    } catch {
      /* keep default */
    }
    return [
      {
        title,
        url: link,
        source,
        publishedAt: hit.created_at ?? new Date().toISOString(),
        orgs: detectOrgs(title)
      }
    ];
  });
}

/** Fallback live feed: GDELT artlist. */
async function fetchGdelt(now: Date, limit: number): Promise<NewsItem[]> {
  const query = encodeURIComponent(
    '("artificial intelligence" OR "AGI" OR "large language model") sourcelang:english'
  );
  const url =
    `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}` +
    `&mode=artlist&maxrecords=${limit * 2}&sort=datedesc&timespan=7d&format=json`;
  const payload = (await fetchJson(url)) as {
    articles?: Array<{ title?: string; url?: string; domain?: string; seendate?: string }>;
  };
  return (payload.articles ?? []).flatMap((article): NewsItem[] => {
    const title = article.title?.trim();
    const link = article.url?.trim();
    if (!title || !link || !link.startsWith("http")) return [];
    return [
      {
        title,
        url: link,
        source: article.domain ?? "",
        publishedAt: article.seendate ? parseSeenDate(article.seendate) : now.toISOString(),
        orgs: detectOrgs(title)
      }
    ];
  });
}

// Keep only genuinely AI-relevant stories. Broad queries pull some noise
// (generic "AI" mentions, unrelated tools); require an org tag or a clear
// AI/ML term in the title.
const AI_RELEVANCE_RE =
  /\b(a\.?i\.?|artificial intelligence|agi|asi|llm|llms|gpt|chatgpt|claude|gemini|llama|grok|deepseek|qwen|mistral|openai|anthropic|deepmind|nvidia|machine learning|deep learning|neural|transformer|inference|model|models|agent|agentic|chatbot|reasoning|fine-tun|diffusion|robot|autonom|superintelligence|frontier model)\b/i;

function isRelevant(item: NewsItem): boolean {
  return item.orgs.length > 0 || AI_RELEVANCE_RE.test(item.title);
}

/**
 * Fill the timeline's recent past: for each of the last `monthsBack` months,
 * fetch the highest-signal AI stories from Hacker News (real, dated, cited).
 * This closes the gap between curated landmark milestones and the live feed.
 */
export async function fetchHistoricalMilestones(
  now: Date,
  monthsBack = 11,
  perMonth = 2
): Promise<NewsItem[]> {
  const windows: Array<{ start: number; end: number }> = [];
  let cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  for (let i = 0; i < monthsBack; i += 1) {
    const end = Math.floor(cursor.getTime() / 1000);
    const prev = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() - 1, 1));
    windows.push({ start: Math.floor(prev.getTime() / 1000), end });
    cursor = prev;
  }

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  async function topForMonth(start: number, end: number): Promise<NewsItem[]> {
    const url =
      `https://hn.algolia.com/api/v1/search?query=AI&tags=story` +
      `&numericFilters=created_at_i%3E${start},created_at_i%3C${end}&hitsPerPage=25`;
    const payload = (await fetchJson(url)) as {
      hits?: Array<{
        title?: string;
        url?: string | null;
        created_at?: string;
        objectID?: string;
        points?: number;
      }>;
    };
    const scored = (payload.hits ?? []).flatMap((hit) => {
      const title = hit.title?.trim();
      if (!title) return [];
      const orgs = detectOrgs(title);
      if (!(orgs.length > 0 || AI_RELEVANCE_RE.test(title))) return [];
      const link =
        hit.url && hit.url.startsWith("http")
          ? hit.url
          : `https://news.ycombinator.com/item?id=${hit.objectID}`;
      let source = "news.ycombinator.com";
      try {
        source = new URL(link).hostname.replace(/^www\./, "");
      } catch {
        /* keep default */
      }
      const item: NewsItem = {
        title,
        url: link,
        source,
        publishedAt: hit.created_at ?? new Date(end * 1000).toISOString(),
        orgs
      };
      const score = (hit.points ?? 0) + (orgs.length > 0 ? 400 : 0);
      return [{ item, score }];
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, perMonth).map((s) => s.item);
  }

  // Sequential with spacing + one retry — HN throttles request bursts, which
  // otherwise drops the most recent months.
  const collected: NewsItem[] = [];
  for (const { start, end } of windows) {
    let items: NewsItem[] = [];
    for (let attempt = 0; attempt < 2 && items.length === 0; attempt += 1) {
      if (attempt > 0) await sleep(700);
      try {
        items = await topForMonth(start, end);
      } catch {
        items = [];
      }
    }
    collected.push(...items);
    await sleep(300);
  }

  return dedupeAndTake(collected, monthsBack * perMonth);
}

export async function fetchLiveNews(now: Date, limit = 30): Promise<NewsItem[]> {
  const sources: Array<() => Promise<NewsItem[]>> = [
    () => fetchHackerNews(limit),
    () => fetchGdelt(now, limit)
  ];

  const collected: NewsItem[] = [];
  for (const source of sources) {
    try {
      collected.push(...(await source()));
      if (collected.filter(isRelevant).length >= limit) break;
    } catch {
      /* try the next source */
    }
  }

  const relevant = collected.filter(isRelevant);
  relevant.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return dedupeAndTake(relevant, limit);
}
