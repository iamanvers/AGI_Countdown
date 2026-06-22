import { MarimekkoChart } from "@/components/marimekko-chart";
import { PageFrame } from "@/components/page-frame";
import { type JobsRegion, readJobs } from "@/lib/static-data";

export const metadata = {
  title: "Jobs & Automation — AGI Countdown",
  description: "AI automation exposure by sector and region, the revenue at risk, and the roles emerging vs fading."
};

const CARD = "card";

export default async function JobsPage() {
  const jobs = await readJobs();
  const sectors = [...jobs.sectors].sort((a, b) => b.automationExposurePct - a.automationExposurePct);
  const regions = [...jobs.regions].sort((a, b) => b.automationExposurePct - a.automationExposurePct);
  const highlights = [...jobs.highlights].sort((a, b) => b.demandSignal - a.demandSignal);

  return (
    <PageFrame
      eyebrow="Impact on work"
      intro="How exposed each part of the economy is to AI automation — by sector and by region — the economic value at stake, and the roles emerging vs fading. Figures are curated from published labor and macro research (BLS, OECD, IMF, ILO, McKinsey, Anthropic Economic Index) and cited throughout."
      title="Jobs & Automation"
    >
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Headline label="Overall task exposure" value={`${jobs.overallAutomationPct.toFixed(0)}%`} sub="share of work tasks AI can assist" />
        <Headline
          label="Revenue at risk"
          value={`$${jobs.revenueAtRisk.annualValueUsdTn}T`}
          sub="annual value exposed to AI / yr"
          accent
        />
        <Headline label="Tasks exposed" value={`${jobs.revenueAtRisk.exposedRevenueSharePct}%`} sub="of work activity, by value" />
        <Headline
          label="Most-exposed sector"
          value={sectors[0] ? `${sectors[0].automationExposurePct}%` : "—"}
          sub={sectors[0]?.sector}
        />
      </section>

      {/* Revenue at risk callout */}
      <section className={`${CARD} grid gap-3 p-6`}>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-xl font-semibold">Revenue at risk — the value AI puts in play</h2>
          <a
            className="focus-ring rounded-full border border-[rgb(var(--line)/0.6)] px-3 py-1 text-xs text-[rgb(var(--muted))] hover:border-[rgb(var(--accent-rgb)/0.6)] hover:text-[rgb(var(--accent-rgb))]"
            href={jobs.revenueAtRisk.source}
            rel="noreferrer"
            target="_blank"
          >
            Source: McKinsey ↗
          </a>
        </div>
        <p className="max-w-3xl text-sm leading-7 text-[rgb(var(--muted))]">{jobs.revenueAtRisk.description}</p>
      </section>

      {/* Regional split */}
      <section className="grid gap-3">
        <div>
          <h2 className="text-2xl font-semibold">By region</h2>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            Exposure is far from uniform — advanced economies see ~60% of jobs affected, lower-income
            regions closer to ~26% (IMF). The bar is automation exposure; the chip is revenue at risk.
          </p>
        </div>
        <div className={`${CARD} grid gap-1 p-5`}>
          {regions.map((region) => (
            <RegionRow key={region.region} region={region} />
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-2xl font-semibold">Workforce share × automation exposure</h2>
        <p className="text-sm text-[rgb(var(--muted))]">
          Column width = share of the workforce; height = automation exposure. US employment basis.
        </p>
        <MarimekkoChart sectors={jobs.sectors} />
      </section>

      <section className="grid gap-3">
        <h2 className="text-2xl font-semibold">By sector</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {sectors.map((sector) => (
            <article className={`${CARD} grid gap-3 p-5`} key={sector.sector}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold leading-tight">{sector.sector}</h3>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">{sector.workforceSharePct}% of workforce</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <a
                    className="focus-ring rounded-full bg-[rgb(var(--accent-rgb)/0.16)] px-3 py-1 text-sm font-semibold text-[rgb(var(--accent-rgb))]"
                    href={sector.source}
                    rel="noreferrer"
                    target="_blank"
                    title="Source"
                  >
                    {sector.automationExposurePct}% exposed
                  </a>
                  <span className="rounded-full border border-[rgb(var(--line)/0.6)] px-2.5 py-0.5 text-xs text-[rgb(var(--muted))] tabular">
                    {sector.revenueAtRiskPct}% revenue at risk
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--positive))]">
                  Emerging roles
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {sector.emergingRoles.map((role) => (
                    <span
                      className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--line)/0.55)] bg-[rgb(var(--panel)/0.5)] px-3 py-1 text-sm"
                      key={role.title}
                    >
                      {role.title}
                      <span className="text-xs text-[rgb(var(--muted))] tabular">{Math.round(role.demandSignal * 100)}</span>
                    </span>
                  ))}
                </div>
              </div>

              {sector.decliningRoles.length > 0 ? (
                <div>
                  <p className="text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Fading</p>
                  <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">{sector.decliningRoles.join(" · ")}</p>
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
            <article className={`${CARD} flex items-start justify-between gap-3 p-4`} key={job.title}>
              <div>
                <h3 className="font-semibold leading-tight">{job.title}</h3>
                <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">{job.description}</p>
              </div>
              <span className="shrink-0 rounded-full bg-[rgb(var(--positive)/0.15)] px-2.5 py-1 text-xs font-semibold text-[rgb(var(--positive))] tabular">
                {Math.round(job.demandSignal * 100)} demand
              </span>
            </article>
          ))}
        </div>
      </section>

      <p className="text-sm leading-6 text-[rgb(var(--muted))]">
        Automation <strong className="text-[rgb(var(--foreground))]">exposure</strong> measures the
        share of tasks a role performs that current AI can meaningfully assist or perform — not the
        share of jobs that disappear. <strong className="text-[rgb(var(--foreground))]">Revenue at
        risk</strong> is the economic value tied to those exposed activities. Both are estimates, not
        forecasts of unemployment.
      </p>
    </PageFrame>
  );
}

function RegionRow({ region }: { region: JobsRegion }) {
  return (
    <div className="grid gap-1 border-t border-[rgb(var(--line)/0.4)] py-3 first-of-type:border-t-0 first-of-type:pt-0 sm:grid-cols-[200px_1fr_auto] sm:items-center sm:gap-4">
      <div>
        <p className="text-sm font-medium">{region.region}</p>
        <p className="mt-0.5 hidden text-xs text-[rgb(var(--muted))] sm:block">{region.note}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[rgb(var(--panel-strong))]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[rgb(var(--accent-rgb)/0.6)] to-[rgb(var(--accent-rgb))]"
            style={{ width: `${region.automationExposurePct}%` }}
          />
        </div>
        <span className="w-10 text-right text-sm tabular">{region.automationExposurePct}%</span>
      </div>
      <a
        className="focus-ring justify-self-start rounded-full border border-[rgb(var(--line)/0.6)] px-2.5 py-0.5 text-xs text-[rgb(var(--muted))] hover:border-[rgb(var(--accent-rgb)/0.6)] hover:text-[rgb(var(--accent-rgb))] sm:justify-self-end"
        href={region.source}
        rel="noreferrer"
        target="_blank"
        title="Source"
      >
        {region.revenueAtRiskPct}% rev at risk ↗
      </a>
    </div>
  );
}

function Headline({
  label,
  value,
  sub,
  accent
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`${CARD} p-5`}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">{label}</p>
      <p
        className={`mt-3 font-mono text-4xl font-semibold tabular ${accent ? "gradient-text" : "text-[rgb(var(--accent-rgb))]"}`}
      >
        {value}
      </p>
      {sub ? <p className="mt-1 text-xs text-[rgb(var(--muted))]">{sub}</p> : null}
    </div>
  );
}
