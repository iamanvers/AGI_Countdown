import { PageFrame } from "@/components/page-frame";
import { type SourceStatus, formatDateOnly, groupBy, readSources } from "@/lib/static-data";

export const metadata = {
  title: "Sources — AGI Countdown",
  description: "Every source behind the clock, with live health and a tiered reference catalog."
};

const statusClass: Record<string, string> = {
  ok: "bg-emerald-500/15 text-emerald-300",
  stale: "bg-amber-400/15 text-amber-200",
  failed: "bg-red-500/15 text-red-300",
  reference: "bg-[rgb(var(--panel-strong)/0.8)] text-[rgb(var(--muted))]"
};

const TIER_LABEL: Record<string, string> = {
  primary: "Primary — first-party data, research & official",
  secondary: "Secondary — analysis, labs orgs & think tanks",
  tertiary: "Tertiary — trade press, aggregators & trackers"
};

export default async function SourcesPage() {
  const sources = await readSources();
  const signal = sources.filter((source) => source.status !== "reference");
  const reference = sources.filter((source) => source.status === "reference");

  const signalByDomain = groupBy(signal, (source) => source.domain);
  const tiers: Array<SourceStatus["tier"]> = ["primary", "secondary", "tertiary"];

  return (
    <PageFrame
      eyebrow="Evidence base"
      intro={`${sources.length} sources feed and surround the clock — ${signal.length} live signal feeds with health, plus a ${reference.length}-source reference catalog tiered primary, secondary, and tertiary. Every figure on the site traces back here.`}
      title="Sources"
    >
      <section className="grid gap-3 sm:grid-cols-4">
        <Metric label="Total" value={sources.length} />
        <Metric label="Live signals" value={signal.length} />
        <Metric label="Reference" value={reference.length} />
        <Metric label="Live & healthy" value={signal.filter((s) => s.status === "ok").length} />
      </section>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold">Live signal feeds</h2>
          <p className="text-sm text-[rgb(var(--muted))]">These produce the numeric factors driving the date.</p>
        </div>
        {Object.entries(signalByDomain).map(([domain, domainSources]) => (
          <div className="grid gap-3" key={domain}>
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
              {domain} · {domainSources.length}
            </h3>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {domainSources.map((source) => (
                <article
                  className="rounded-lg border border-[rgb(var(--line)/0.66)] bg-[rgb(var(--panel)/0.6)] p-4 backdrop-blur"
                  key={source.sourceId}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-semibold leading-tight">{source.name}</h4>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${statusClass[source.status]}`}>
                      {source.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                    {source.cadence ?? "—"} · fetched {formatDateOnly(source.lastFetchedAt)}
                  </p>
                  <a
                    className="focus-ring mt-2 block truncate rounded-sm text-sm text-[rgb(var(--accent-rgb))]"
                    href={source.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {source.url}
                  </a>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold">Reference catalog</h2>
          <p className="text-sm text-[rgb(var(--muted))]">
            Monitored for credibility and attribution; not each a numeric feed.
          </p>
        </div>
        {tiers.map((tier) => {
          const inTier = reference.filter((source) => source.tier === tier);
          if (inTier.length === 0) return null;
          return (
            <div className="grid gap-3" key={tier}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-semibold">{TIER_LABEL[tier ?? "tertiary"]}</h3>
                <span className="text-sm text-[rgb(var(--muted))]">{inTier.length}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {inTier.map((source) => (
                  <a
                    className="focus-ring group inline-flex items-center gap-2 rounded-full border border-[rgb(var(--line)/0.55)] bg-[rgb(var(--panel)/0.5)] px-3 py-1.5 text-sm transition-colors hover:border-[rgb(var(--accent-rgb)/0.6)]"
                    href={source.url}
                    key={source.sourceId}
                    rel="noreferrer"
                    target="_blank"
                    title={`${source.name} · ${source.domain}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--accent-rgb)/0.7)]" />
                    {source.name}
                    <span className="text-xs text-[rgb(var(--muted))]">{source.domain}</span>
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </PageFrame>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[rgb(var(--line)/0.68)] bg-[rgb(var(--panel)/0.66)] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">{label}</p>
      <p className="mt-3 font-mono text-4xl font-semibold tabular">{value}</p>
    </div>
  );
}
