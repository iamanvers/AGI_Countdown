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
  Anthropic: ["anthropic", "claude"],
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

export async function fetchLiveNews(now: Date, limit = 30): Promise<NewsItem[]> {
  const query = encodeURIComponent(
    '("artificial intelligence" OR "AGI" OR "large language model") sourcelang:english',
  );
  const url =
    `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}` +
    `&mode=artlist&maxrecords=${limit * 2}&sort=datedesc&timespan=7d&format=json`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "agi-countdown-pipeline/1.0" }
    });
    if (!response.ok) {
      throw new Error(`GDELT artlist responded ${response.status}`);
    }
    const payload = (await response.json()) as {
      articles?: Array<{ title?: string; url?: string; domain?: string; seendate?: string }>;
    };
    const articles = payload.articles ?? [];

    const seen = new Set<string>();
    const items: NewsItem[] = [];
    for (const article of articles) {
      const title = article.title?.trim();
      const link = article.url?.trim();
      if (!title || !link || !link.startsWith("http")) continue;
      const key = title.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({
        title,
        url: link,
        source: article.domain ?? new URL(link).hostname,
        publishedAt: article.seendate ? parseSeenDate(article.seendate) : now.toISOString(),
        orgs: detectOrgs(title)
      });
      if (items.length >= limit) break;
    }
    return items;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
