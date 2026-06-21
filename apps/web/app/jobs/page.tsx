import { MarimekkoChart } from "@/components/marimekko-chart";
import { PageFrame } from "@/components/page-frame";
import { readJobs } from "@/lib/static-data";

export const metadata = {
  title: "Jobs & Automation — AGI Countdown",
  description: "AI automation exposure by sector, the roles emerging, and the roles fading."
};

export default async function JobsPage() {
  const jobs = await readJobs();
  const sectors = [...jobs.sectors].sort((a, b) => b.automationExposurePct - a.automationExposurePct);
  const highlights = [...jobs.highlights].sort((a, b) => b.demandSignal - a.demandSignal);

  return (
    <PageFrame
      eyebrow="Impact on work"
      intro="How exposed each part of the economy is to AI automation, the new roles each sector is creating, and the roles fading. Figures are curated from published labor research (BLS, OECD, Anthropic Economic Index, O*NET) and cited per sector."
      title="Jobs & Automation"
    >
      <section className="grid gap-4 sm:grid-cols-3">
        <Headline label="Overall task exposure" value={`${jobs.overallAutomationPct.toFixed(0)}%`} />
        <Headline label="Sectors tracked" value={String(jobs.sectors.length)} />
        <Headline
          label="Most-exposed sector"
          value={sectors[0] ? `${sectors[0].automationExposurePct}%` : "—"}
          sub={sectors[0]?.sector}
        />
      </section>

      <section className="grid gap-3">
        <h2 className="text-2xl font-semibold">Workforce share × automation exposure</h2>
        <MarimekkoChart sectors={jobs.sectors} />
      </section>

      <section className="grid gap-3">
        <h2 className="text-2xl font-semibold">By sector</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {sectors.map((sector) => (
            <article
              className="grid gap-3 rounded-lg border border-[rgb(var(--line)/0.66)] bg-[rgb(var(--panel)/0.55)] p-5"
              key={sector.sector}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold leading-tight">{sector.sector}</h3>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    {sector.workforceSharePct}% of workforce
                  </p>
                </div>
                <a
                  className="focus-ring shrink-0 rounded-full bg-[rgb(var(--accent-rgb)/0.16)] px-3 py-1 text-sm font-semibold text-[rgb(var(--accent-rgb))]"
                  href={sector.source}
                  rel="noreferrer"
                  target="_blank"
                  title="Source"
                >
                  {sector.automationExposurePct}% exposed
                </a>
              </div>

              <div>
                <p className="text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                  Emerging roles
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {sector.emergingRoles.map((role) => (
                    <span
                      className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--line)/0.55)] bg-[rgb(var(--panel)/0.5)] px-3 py-1 text-sm"
                      key={role.title}
                    >
                      {role.title}
                      <span className="text-xs text-[rgb(var(--muted))]">
                        {Math.round(role.demandSignal * 100)}
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {sector.decliningRoles.length > 0 ? (
                <div>
                  <p className="text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                    Fading
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">
                    {sector.decliningRoles.join(" · ")}
                  </p>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-2xl font-semibold">Fastest-growing roles (cross-sector)</h2>
        <div className="grid gap-2">
          {highlights.map((job) => (
            <article
              className="flex items-start justify-between gap-3 rounded-lg border border-[rgb(var(--line)/0.6)] bg-[rgb(var(--panel)/0.5)] p-4"
              key={job.title}
            >
              <div>
                <h3 className="font-semibold leading-tight">{job.title}</h3>
                <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">{job.description}</p>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                {Math.round(job.demandSignal * 100)} demand
              </span>
            </article>
          ))}
        </div>
      </section>

      <p className="text-sm leading-6 text-[rgb(var(--muted))]">
        Automation exposure measures the share of tasks a role performs that current AI can
        meaningfully assist or perform — not the share of jobs that disappear. It is an estimate, not
        a forecast of unemployment.
      </p>
    </PageFrame>
  );
}

function Headline({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-[rgb(var(--line)/0.68)] bg-[rgb(var(--panel)/0.66)] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">{label}</p>
      <p className="mt-3 font-mono text-4xl font-semibold tabular text-[rgb(var(--accent-rgb))]">{value}</p>
      {sub ? <p className="mt-1 text-xs text-[rgb(var(--muted))]">{sub}</p> : null}
    </div>
  );
}
