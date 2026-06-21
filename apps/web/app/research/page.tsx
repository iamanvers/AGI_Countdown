import { PageFrame } from "@/components/page-frame";
import { groupBy, readFactors, readSources } from "@/lib/static-data";

export default async function ResearchPage() {
  const [factors, sources] = await Promise.all([readFactors(), readSources()]);
  const grouped = groupBy(factors, (factor) => factor.domain);
  const sourceNames = new Map(sources.map((source) => [source.sourceId, source.name]));

  return (
    <PageFrame
      eyebrow="Research Ledger"
      intro="The active factor readings behind the estimate, grouped by domain with confidence, normalized signal value, and citation trail."
      title="Research"
    >
      <section className="grid gap-8">
        {Object.entries(grouped).map(([domain, domainFactors]) => (
          <div className="grid gap-3" key={domain}>
            <h2 className="text-2xl font-semibold capitalize">{domain}</h2>
            <div className="grid gap-3 lg:grid-cols-2">
              {domainFactors.map((factor) => (
                <article
                  className="rounded-lg border border-[rgb(var(--line)/0.68)] bg-[rgb(var(--panel)/0.66)] p-5 backdrop-blur"
                  key={`${factor.factorId}-${factor.sourceId}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold">{factor.factorName ?? factor.factorId}</h3>
                      <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                        {sourceNames.get(factor.sourceId) ?? factor.sourceId}
                      </p>
                    </div>
                    <span className="rounded-full border border-[rgb(var(--line)/0.68)] px-3 py-1 font-mono text-xs">
                      {(factor.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-[rgb(var(--panel-strong))]">
                    <div
                      className="h-full rounded-full bg-[rgb(var(--accent-rgb))]"
                      style={{ width: `${Math.max(0, Math.min(1, factor.normalized)) * 100}%` }}
                    />
                  </div>
                  <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Raw</dt>
                      <dd className="mt-1 truncate font-mono">{String(factor.raw)}</dd>
                    </div>
                    <div>
                      <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Norm</dt>
                      <dd className="mt-1 font-mono">{factor.normalized.toFixed(2)}</dd>
                    </div>
                    <div>
                      <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Unit</dt>
                      <dd className="mt-1 truncate">{factor.unit ?? "index"}</dd>
                    </div>
                  </dl>
                  <a
                    className="focus-ring mt-4 block truncate rounded-sm text-sm text-[rgb(var(--accent-rgb))]"
                    href={factor.citation}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {factor.citation}
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
