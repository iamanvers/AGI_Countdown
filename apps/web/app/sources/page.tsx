import { PageFrame } from "@/components/page-frame";
import { formatDateOnly, groupBy, readSources } from "@/lib/static-data";

const statusClass = {
  ok: "bg-emerald-500/15 text-emerald-300",
  stale: "bg-amber-400/15 text-amber-200",
  failed: "bg-red-500/15 text-red-300"
};

export default async function SourcesPage() {
  const sources = await readSources();
  const grouped = groupBy(sources, (source) => source.domain);
  const healthy = sources.filter((source) => source.status === "ok").length;
  const stale = sources.filter((source) => source.status === "stale").length;
  const failed = sources.filter((source) => source.status === "failed").length;

  return (
    <PageFrame
      eyebrow="Source Health"
      intro="Every number feeding the clock keeps its origin, cadence, health state, and last successful fetch visible."
      title="Sources"
    >
      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="OK" value={healthy} />
        <Metric label="Stale" value={stale} />
        <Metric label="Failed" value={failed} />
      </section>

      <section className="grid gap-8">
        {Object.entries(grouped).map(([domain, domainSources]) => (
          <div className="grid gap-3" key={domain}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-2xl font-semibold capitalize">{domain}</h2>
              <p className="text-sm text-[rgb(var(--muted))]">{domainSources.length} feeds</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {domainSources.map((source) => (
                <article
                  className="rounded-lg border border-[rgb(var(--line)/0.68)] bg-[rgb(var(--panel)/0.66)] p-5 backdrop-blur"
                  key={source.sourceId}
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-lg font-semibold leading-tight">{source.name}</h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${statusClass[source.status]}`}>
                      {source.status}
                    </span>
                  </div>
                  <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Cadence</dt>
                      <dd className="mt-1 capitalize">{source.cadence ?? "unknown"}</dd>
                    </div>
                    <div>
                      <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Fetched</dt>
                      <dd className="mt-1">{formatDateOnly(source.lastFetchedAt)}</dd>
                    </div>
                  </dl>
                  {source.notes ? (
                    <p className="mt-4 text-sm leading-6 text-[rgb(var(--muted))]">{source.notes}</p>
                  ) : null}
                  <a
                    className="focus-ring mt-4 block truncate rounded-sm text-sm text-[rgb(var(--accent-rgb))]"
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
    </PageFrame>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[rgb(var(--line)/0.68)] bg-[rgb(var(--panel)/0.66)] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">{label}</p>
      <p className="mt-3 font-mono text-5xl font-semibold tabular">{value}</p>
    </div>
  );
}
