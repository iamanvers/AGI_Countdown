import { PageFrame } from "@/components/page-frame";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Developers — AGI Countdown",
  description: "The static JSON API behind the clock, plus an embeddable badge. Free, no key, no rate limit."
};

const origin = SITE_URL.replace(/\/$/, "");

const endpoints: Array<{ path: string; desc: string }> = [
  { path: "/data/engine_state.weak-agi.json", desc: "Clock state for Weak AGI — date, band, anchor, Δ, progress, movers." },
  { path: "/data/engine_state.transformative-ai.json", desc: "Clock state for Transformative AI (the default)." },
  { path: "/data/engine_state.strong-agi.json", desc: "Clock state for Strong AGI." },
  { path: "/data/methodology.json", desc: "Every factor: weight, sign, normalization, reading, per-definition effect, sources." },
  { path: "/data/factors.json", desc: "Latest raw + normalized reading for each factor, with citation and health." },
  { path: "/data/estimate_history.json", desc: "Time series of the estimate (tAgi, progress) per definition — the movement chart." },
  { path: "/data/factor_history.json", desc: "Trailing per-factor levels that power the rolling normalization." },
  { path: "/data/timeline.json", desc: "Curated + auto-derived milestones (model releases, new arch, major policy)." },
  { path: "/data/jobs.json", desc: "Automation exposure and revenue-at-risk by sector and region." },
  { path: "/data/sources.json", desc: "The full source catalog with live health and tier." },
  { path: "/data/news.json", desc: "Live 'Latest developments' feed, frontier-lab tagged." },
  { path: "/data/status.json", desc: "Last refresh: run id, cadence, sources ok/failed, Δ, band width." }
];

export default function DevelopersPage() {
  return (
    <PageFrame
      eyebrow="Build on it"
      intro="Everything the site renders is precomputed static JSON, committed on each refresh and served from the edge. No key, no rate limit, no server — just fetch the files. Please attribute AGI Countdown and cache responses."
      title="Developers"
    >
      <section className="grid gap-3">
        <h2 className="text-2xl font-semibold">Data endpoints</h2>
        <div className="card overflow-hidden">
          <ul className="divide-y divide-[rgb(var(--line)/0.5)]">
            {endpoints.map((endpoint) => (
              <li className="grid gap-1 p-4 sm:grid-cols-[minmax(0,0.9fr)_1fr] sm:items-center sm:gap-4" key={endpoint.path}>
                <a
                  className="focus-ring truncate rounded-sm font-mono text-sm text-[rgb(var(--accent-rgb))]"
                  href={endpoint.path}
                  rel="noreferrer"
                  target="_blank"
                >
                  {endpoint.path}
                </a>
                <span className="text-sm text-[rgb(var(--muted))]">{endpoint.desc}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-2xl font-semibold">Quick start</h2>
        <pre className="card overflow-x-auto p-5 font-mono text-xs leading-6 text-[rgb(var(--foreground))]">
{`# the current Transformative-AI estimate
curl -s ${origin}/data/engine_state.transformative-ai.json | jq '{date: .tAgi, progress, band}'

# how the estimate has moved over time
curl -s ${origin}/data/estimate_history.json | jq '.[-5:]'`}
        </pre>
      </section>

      <section className="grid gap-3">
        <h2 className="text-2xl font-semibold">Embeddable badge</h2>
        <p className="text-sm leading-6 text-[rgb(var(--muted))]">
          Drop the live estimate into a README or site. The SVG regenerates on every refresh.
        </p>
        <div className="card grid gap-4 p-5">
          <img alt="AGI Countdown badge" className="h-7 w-fit" src="/badge.svg" />
          <pre className="overflow-x-auto rounded-lg border border-[rgb(var(--line)/0.6)] bg-[rgb(var(--panel-strong)/0.5)] p-4 font-mono text-xs leading-6">
{`<!-- Markdown -->
![AGI Countdown](${origin}/badge.svg)

<!-- HTML -->
<a href="${origin}"><img src="${origin}/badge.svg" alt="AGI Countdown"></a>

<!-- shields.io endpoint -->
https://img.shields.io/endpoint?url=${origin}/badge.json`}
          </pre>
        </div>
      </section>

      <p className="text-sm leading-6 text-[rgb(var(--muted))]">
        The projected date is an <strong className="text-[rgb(var(--foreground))]">estimate</strong>,
        not a prediction of record. See <a className="text-[rgb(var(--accent-rgb))]" href="/methodology">methodology</a>{" "}
        for exactly how it&apos;s built.
      </p>
    </PageFrame>
  );
}
