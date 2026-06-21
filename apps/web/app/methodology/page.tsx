import { EstimateHistoryChart } from "@/components/estimate-history-chart";
import { PageFrame } from "@/components/page-frame";
import { type FactorSnapshot, readEstimateHistory, readFactors, readStatus } from "@/lib/static-data";

export const metadata = {
  title: "Methodology — AGI Countdown",
  description: "Exactly how the AGI Countdown clock is computed."
};

const factorRole: Record<string, { role: "accelerator" | "decelerator"; blurb: string }> = {
  "forecast-consensus-anchor": { role: "accelerator", blurb: "Crowd & market expectations that set the baseline date." },
  "frontier-benchmark-saturation": { role: "accelerator", blurb: "How saturated frontier capability benchmarks are." },
  "training-compute-growth": { role: "accelerator", blurb: "Growth in frontier training compute." },
  "research-velocity": { role: "accelerator", blurb: "AI research output momentum (live: arXiv)." },
  "adoption-usage": { role: "accelerator", blurb: "Real-world model usage and deployment." },
  "datacenter-capex": { role: "accelerator", blurb: "Buildout investment & datacenter revenue." },
  "energy-headroom": { role: "decelerator", blurb: "Power/grid constraints on buildout." },
  "policy-friction": { role: "decelerator", blurb: "Regulatory & governance drag." },
  "public-backlash-pressure": { role: "decelerator", blurb: "Public sentiment / backlash (live: GDELT)." },
  "labor-automation-exposure": { role: "accelerator", blurb: "Economic deployment across occupations." }
};

type AggregatedFactor = {
  factorId: string;
  name: string;
  domain: string;
  normalized: number;
  confidence: number;
  citation: string;
};

function aggregate(factors: FactorSnapshot[]): AggregatedFactor[] {
  const byId = new Map<string, FactorSnapshot[]>();
  for (const factor of factors) {
    if (factor.quarantined) continue;
    byId.set(factor.factorId, [...(byId.get(factor.factorId) ?? []), factor]);
  }
  return [...byId.entries()]
    .map(([factorId, list]) => {
      const normalized = list.reduce((sum, f) => sum + f.normalized, 0) / list.length;
      const confidence = list.reduce((sum, f) => sum + f.confidence, 0) / list.length;
      const best = [...list].sort((a, b) => b.confidence - a.confidence)[0];
      return {
        factorId,
        name: best?.factorName ?? factorId,
        domain: best?.domain ?? "—",
        normalized,
        confidence,
        citation: best?.citation ?? "#"
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default async function MethodologyPage() {
  const [factors, status, history] = await Promise.all([
    readFactors(),
    readStatus(),
    readEstimateHistory()
  ]);
  const aggregated = aggregate(factors);

  return (
    <PageFrame
      eyebrow="How it works"
      intro="The clock is fully deterministic: no model invents the date. Live signals are validated, then a pure function computes the estimate from a forecast-blended anchor and a bounded factor model."
      title="Methodology"
    >
      <section className="grid gap-3 rounded-lg border border-[rgb(var(--line)/0.66)] bg-[rgb(var(--panel)/0.6)] p-6">
        <h2 className="text-xl font-semibold">The formula</h2>
        <p className="font-mono text-lg text-[rgb(var(--accent-rgb))]">
          T_AGI = Anchor + Δ_factors
        </p>
        <p className="text-sm leading-7 text-[rgb(var(--muted))]">
          <strong className="text-[rgb(var(--foreground))]">Anchor</strong> is a weighted blend of
          published forecasts — Metaculus community, prediction markets, expert surveys, and
          compute-based models — giving the slow-moving consensus date.{" "}
          <strong className="text-[rgb(var(--foreground))]">Δ_factors</strong> is the live shift: each
          factor below is normalized, signed (accelerator / decelerator), weighted, smoothed, and
          summed — then <em>clamped</em> so the live model can shape the date but never fabricate it.
        </p>
      </section>

      <section className="grid gap-3">
        <h2 className="text-2xl font-semibold">How the estimate has moved</h2>
        <p className="text-sm leading-7 text-[rgb(var(--muted))]">
          The projected arrival year for each definition, across successive pipeline runs.
        </p>
        <EstimateHistoryChart history={history} />
      </section>

      <section className="grid gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold">Live factors</h2>
          <p className="text-sm text-[rgb(var(--muted))]">
            Last run {new Date(status.startedAt).toUTCString()} · {status.sourcesOk} sources ok ·{" "}
            {status.quarantinedSamples} quarantined
          </p>
        </div>
        <div className="overflow-hidden rounded-lg border border-[rgb(var(--line)/0.66)]">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-[rgb(var(--panel-strong)/0.7)] text-left text-xs uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
              <tr>
                <th className="px-4 py-3 font-semibold">Factor</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Reading</th>
                <th className="px-4 py-3 font-semibold">Source</th>
              </tr>
            </thead>
            <tbody>
              {aggregated.map((factor) => {
                const meta = factorRole[factor.factorId];
                return (
                  <tr className="border-t border-[rgb(var(--line)/0.5)]" key={factor.factorId}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{factor.name}</p>
                      <p className="text-xs text-[rgb(var(--muted))]">{meta?.blurb ?? factor.domain}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          meta?.role === "decelerator"
                            ? "bg-red-500/15 text-red-300"
                            : "bg-emerald-500/15 text-emerald-300"
                        }`}
                      >
                        {meta?.role ?? "signal"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono tabular">{factor.normalized.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <a
                        className="focus-ring rounded-sm text-[rgb(var(--accent-rgb))]"
                        href={factor.citation}
                        rel="noreferrer"
                        target="_blank"
                      >
                        ↗
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-3 rounded-lg border border-[rgb(var(--line)/0.66)] bg-[rgb(var(--panel)/0.55)] p-6">
        <h2 className="text-xl font-semibold">Why you can trust the number</h2>
        <ul className="grid gap-2 text-sm leading-7 text-[rgb(var(--muted))]">
          <li>• <strong className="text-[rgb(var(--foreground))]">Deterministic:</strong> identical inputs always produce the identical date — it&apos;s arithmetic, not a model&apos;s guess.</li>
          <li>• <strong className="text-[rgb(var(--foreground))]">Bounded:</strong> the live shift is clamped, so no single signal can send the date to an absurd place.</li>
          <li>• <strong className="text-[rgb(var(--foreground))]">Cited:</strong> every factor links to its source; failed sources are flagged, not faked.</li>
          <li>• <strong className="text-[rgb(var(--foreground))]">Honest:</strong> a confidence band is always shown — this is an estimate, not a prediction of record.</li>
        </ul>
      </section>
    </PageFrame>
  );
}
