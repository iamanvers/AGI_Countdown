import { PageFrame } from "@/components/page-frame";
import { readJobs } from "@/lib/static-data";

export const metadata = {
  title: "Jobs & Automation — AGI Countdown",
  description: "AI automation exposure by sector and occupation, and the roles emerging."
};

export default async function JobsPage() {
  const jobs = await readJobs();
  const sectors = [...jobs.bySector].sort((a, b) => b.automationPct - a.automationPct);
  const occupations = [...jobs.byOccupation].sort((a, b) => b.exposurePct - a.exposurePct);
  const emerging = [...jobs.emergingJobs].sort((a, b) => b.demandSignal - a.demandSignal);

  return (
    <PageFrame
      eyebrow="Impact on work"
      intro="How exposed today's work is to AI automation, and which roles are growing because of it. Figures are curated from published labor research and cited per row."
      title="Jobs & Automation"
    >
      <section className="grid gap-4 sm:grid-cols-3">
        <Headline label="Overall task automation exposure" value={`${jobs.overallAutomationPct.toFixed(0)}%`} />
        <Headline label="Sectors tracked" value={String(jobs.bySector.length)} />
        <Headline label="Emerging roles tracked" value={String(jobs.emergingJobs.length)} />
      </section>

      <section className="grid gap-3">
        <h2 className="text-2xl font-semibold">Automation exposure by sector</h2>
        <div className="grid gap-3 rounded-lg border border-[rgb(var(--line)/0.66)] bg-[rgb(var(--panel)/0.55)] p-5">
          {sectors.map((sector) => (
            <div className="grid gap-1" key={sector.sector}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <a
                  className="focus-ring rounded-sm font-medium hover:text-[rgb(var(--accent-rgb))]"
                  href={sector.source}
                  rel="noreferrer"
                  target="_blank"
                >
                  {sector.sector}
                </a>
                <span className="font-mono tabular text-[rgb(var(--muted))]">
                  {sector.automationPct.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[rgb(var(--panel-strong)/0.8)]">
                <div
                  className="h-full rounded-full bg-[rgb(var(--accent-rgb))]"
                  style={{ width: `${Math.min(100, sector.automationPct)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-3">
          <h2 className="text-2xl font-semibold">Most-exposed occupations</h2>
          <div className="grid gap-2">
            {occupations.map((occ) => (
              <div
                className="flex items-center justify-between gap-3 rounded-lg border border-[rgb(var(--line)/0.6)] bg-[rgb(var(--panel)/0.5)] px-4 py-3"
                key={occ.onetCode}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{occ.title}</p>
                  <p className="font-mono text-xs text-[rgb(var(--muted))]">{occ.onetCode}</p>
                </div>
                <span className="font-mono text-lg font-semibold tabular">{occ.exposurePct.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <h2 className="text-2xl font-semibold">Emerging roles</h2>
          <div className="grid gap-2">
            {emerging.map((job) => (
              <article
                className="rounded-lg border border-[rgb(var(--line)/0.6)] bg-[rgb(var(--panel)/0.5)] p-4"
                key={job.title}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold leading-tight">{job.title}</h3>
                  <span className="shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                    {Math.round(job.demandSignal * 100)} demand
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{job.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <p className="text-sm leading-6 text-[rgb(var(--muted))]">
        Automation exposure measures the share of tasks a role performs that current AI can
        meaningfully assist or perform — not the share of jobs that disappear. Exposure is an
        estimate, not a forecast of unemployment.
      </p>
    </PageFrame>
  );
}

function Headline({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[rgb(var(--line)/0.68)] bg-[rgb(var(--panel)/0.66)] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">{label}</p>
      <p className="mt-3 font-mono text-4xl font-semibold tabular text-[rgb(var(--accent-rgb))]">{value}</p>
    </div>
  );
}
