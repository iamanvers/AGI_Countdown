import { EngineFlowGraph, type FlowFactor, type FlowOutput } from "@/components/engine-flow-graph";
import { EstimateHistoryChart } from "@/components/estimate-history-chart";
import { PageFrame } from "@/components/page-frame";
import {
  type MethodologyFactor,
  readEngineState,
  readEstimateHistory,
  readMethodology,
  readStatus
} from "@/lib/static-data";

type DefId = "weak-agi" | "transformative-ai" | "strong-agi";

export const metadata = {
  title: "Methodology — AGI Countdown",
  description: "Exactly how the AGI Countdown clock is computed — every weight and source in the open."
};

function ContributionChips({ factor }: { factor: MethodologyFactor }) {
  const order: Array<[string, string]> = [
    ["weak-agi", "W"],
    ["transformative-ai", "T"],
    ["strong-agi", "S"]
  ];
  const chips = order.flatMap(([id, short]) => {
    const v = factor.contributionMonths[id];
    if (v === undefined) return [];
    return [{ id, short, v }];
  });
  if (chips.length === 0) return <span className="text-[rgb(var(--muted))]">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {chips.map(({ id, short, v }) => {
        const sooner = v < 0;
        return (
          <span
            className="rounded bg-[rgb(var(--panel-strong)/0.7)] px-1.5 py-0.5 text-[0.66rem] tabular"
            key={id}
            style={{ color: sooner ? "rgb(var(--accent-rgb))" : "rgb(var(--later))" }}
            title={`${short}: ${sooner ? "sooner" : "later"} ${Math.abs(v).toFixed(1)} mo`}
          >
            {short} {v > 0 ? "+" : ""}
            {v.toFixed(1)}
          </span>
        );
      })}
    </div>
  );
}

/** Compact note on how this factor's reading was normalized this run. */
function normalizationNote(factor: MethodologyFactor): string {
  const rolling = factor.reading?.rolling;
  const level = factor.reading?.level;
  const levelPct = typeof level === "number" ? `level ${Math.round(level * 100)}` : "level";
  if (!rolling || !rolling.applied) {
    const n = rolling?.sampleSize ?? 0;
    return `${levelPct} · building history (${n})`;
  }
  const detail =
    rolling.method === "zscore" || rolling.method === "log-zscore"
      ? `z ${rolling.zScore >= 0 ? "+" : ""}${rolling.zScore.toFixed(2)}`
      : `p${Math.round(rolling.percentile * 100)}`;
  return `${levelPct} · ${detail} · n ${rolling.sampleSize}`;
}

export default async function MethodologyPage() {
  const [methodology, status, history, weak, transformative, strong] = await Promise.all([
    readMethodology(),
    readStatus(),
    readEstimateHistory(),
    readEngineState("weak-agi"),
    readEngineState("transformative-ai"),
    readEngineState("strong-agi")
  ]);
  const factors = [...methodology.factors].sort((a, b) => b.weight - a.weight);

  const flowFactors: FlowFactor[] = methodology.factors.map((f) => ({
    id: f.id,
    label: f.label,
    sign: f.sign,
    weight: f.weight,
    domain: f.domain,
    category: f.category,
    level: f.reading ? (f.reading.level ?? f.reading.normalized) : null,
    contributionMonths: f.contributionMonths,
    sources: f.sources
  }));
  const toOutput = (s: typeof weak): FlowOutput => ({
    tAgi: s.tAgi,
    anchor: s.anchor,
    deltaMonths: s.deltaMonths,
    progress: s.progress,
    band: s.band
  });
  const flowOutputs: Record<DefId, FlowOutput> = {
    "weak-agi": toOutput(weak),
    "transformative-ai": toOutput(transformative),
    "strong-agi": toOutput(strong)
  };

  return (
    <PageFrame
      eyebrow="How it works"
      intro="The clock is fully deterministic — no model invents the date. Public forecasts set an anchor; a bounded, weighted model of live factors moves it. Every weight, normalization, reading, and source is shown below."
      title="Methodology"
    >
      <section className="card card-accent grid gap-3 p-6">
        <p className="font-mono text-lg text-[rgb(var(--accent-rgb))]">T_AGI = Anchor + Δfactors</p>
        <p className="text-sm leading-7 text-[rgb(var(--muted))]">
          <strong className="text-[rgb(var(--foreground))]">Anchor</strong> blends four published
          forecasts (Metaculus, prediction markets, expert surveys, compute-based models) by a weighted
          quantile. <strong className="text-[rgb(var(--foreground))]">Δfactors</strong> = Σ (−sign ×
          weight × reading × confidence) across the factors below, EWMA-smoothed (α ={" "}
          {methodology.smoothingAlpha}) and clamped to each definition&apos;s ± limit so no single
          signal can run away with the date. The estimate and band are floored to the present.
        </p>
      </section>

      <section className="grid gap-3">
        <h2 className="text-2xl font-semibold">Per-definition settings</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {methodology.definitions.map((def) => (
            <div className="card grid gap-3 p-5" key={def.id}>
              <p className="font-semibold">{def.name}</p>
              <div className="flex justify-between text-sm">
                <span className="text-[rgb(var(--muted))]">Max live shift</span>
                <span className="tabular">±{def.maxShiftMonths} mo</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[rgb(var(--muted))]">Capability scale</span>
                <span className="tabular">×{def.progressScale}</span>
              </div>
              <div className="border-t border-[rgb(var(--line)/0.5)] pt-2">
                <p className="text-[0.66rem] uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                  Forecast anchor blend
                </p>
                <div className="mt-1 grid gap-1">
                  {def.anchorBlend.map((a) => (
                    <a
                      className="focus-ring flex justify-between rounded-sm text-xs hover:text-[rgb(var(--accent-rgb))]"
                      href={a.citation}
                      key={a.bucket}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span className="text-[rgb(var(--muted))]">{a.label}</span>
                      <span className="tabular">{Math.round(a.weight * 100)}%</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-2xl font-semibold">The flow, end to end</h2>
        <p className="text-sm leading-6 text-[rgb(var(--muted))]">
          Forecasts set the <strong className="text-[rgb(var(--foreground))]">anchor</strong>; each live
          factor feeds <strong className="text-[rgb(var(--foreground))]">Δ factors</strong>; the two
          combine into the date. Switch definition to see the same factors re-weighted, and hover any
          node to trace its contribution.
        </p>
        <EngineFlowGraph definitions={methodology.definitions.map((d) => ({ id: d.id as DefId, name: d.name }))} factors={flowFactors} outputs={flowOutputs} />
      </section>

      <section className="grid gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold">Live factors</h2>
          <p className="text-sm text-[rgb(var(--muted))]">
            Last run {new Date(status.startedAt).toUTCString()} · {status.sourcesOk} sources ok
          </p>
        </div>
        <p className="text-sm leading-6 text-[rgb(var(--muted))]">
          <strong className="text-[rgb(var(--foreground))]">Reading</strong> is the engine signal,
          0–100. Once a factor has enough history it is normalized against its own trend — a{" "}
          <strong className="text-[rgb(var(--foreground))]">z-score</strong> (50 = at the trailing
          mean) for level signals or an empirical <strong className="text-[rgb(var(--foreground))]">percentile</strong>{" "}
          for momentum signals — so the date moves on deviation-from-trend, not on a static constant
          (it falls back to the raw level until enough samples exist). <strong className="text-[rgb(var(--foreground))]">Weight</strong>{" "}
          is months of shift per unit. <strong className="text-[rgb(var(--foreground))]">Effect</strong>{" "}
          is this factor&apos;s contribution to each definition&apos;s date this run (W/T/S).{" "}
          <strong className="text-[rgb(var(--foreground))]">Role</strong> is the factor&apos;s nature —
          a decelerator that is <em>easing</em> (low reading) can still pull the date sooner, so Role
          and Effect can point different ways.
        </p>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead className="bg-[rgb(var(--panel-strong)/0.7)] text-left text-xs uppercase tracking-[0.1em] text-[rgb(var(--muted))]">
              <tr>
                <th className="px-4 py-3 font-semibold">Factor</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Weight</th>
                <th className="px-4 py-3 font-semibold">Reading</th>
                <th className="px-4 py-3 font-semibold">Effect (W/T/S, mo)</th>
                <th className="px-4 py-3 font-semibold">Sources</th>
              </tr>
            </thead>
            <tbody>
              {factors.map((factor) => {
                const reading = factor.reading ? Math.round(factor.reading.normalized * 100) : null;
                const accel = factor.sign === 1;
                return (
                  <tr className="border-t border-[rgb(var(--line)/0.5)] align-top" key={factor.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{factor.label}</p>
                      <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">
                        {factor.category} · {factor.normalization}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1 rounded-full border border-[rgb(var(--line)/0.7)] bg-[rgb(var(--panel-strong)/0.6)] px-2 py-0.5 text-xs font-medium text-[rgb(var(--muted))]"
                        title={
                          accel
                            ? "Higher reading pulls the date sooner"
                            : "Higher reading pushes the date later; an easing (low) reading pulls it sooner"
                        }
                      >
                        {accel ? "↑ accelerator" : "↓ decelerator"}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular">{factor.weight}</td>
                    <td className="px-4 py-3">
                      {reading === null ? (
                        <span className="text-[rgb(var(--muted))]">—</span>
                      ) : (
                        <div className="grid gap-1">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[rgb(var(--panel-strong))]">
                              <div className="h-full rounded-full bg-[rgb(var(--accent-rgb))]" style={{ width: `${reading}%` }} />
                            </div>
                            <span className="tabular text-xs">{reading}</span>
                          </div>
                          <span className="text-[0.66rem] text-[rgb(var(--muted))] tabular">
                            {normalizationNote(factor)}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ContributionChips factor={factor} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {factor.sources.map((s) => (
                          <a
                            className="focus-ring rounded-full border border-[rgb(var(--line)/0.6)] px-2 py-0.5 text-xs text-[rgb(var(--muted))] hover:border-[rgb(var(--accent-rgb)/0.6)] hover:text-[rgb(var(--accent-rgb))]"
                            href={s.url}
                            key={s.id}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {s.name}
                          </a>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-2xl font-semibold">How the estimate has moved</h2>
        <EstimateHistoryChart history={history} />
      </section>

      <section className="card grid gap-3 p-6">
        <h2 className="text-xl font-semibold">Why you can trust the number</h2>
        <ul className="grid gap-2 text-sm leading-7 text-[rgb(var(--muted))]">
          <li>• <strong className="text-[rgb(var(--foreground))]">Deterministic:</strong> identical inputs always produce the identical date — arithmetic, not a model&apos;s guess.</li>
          <li>• <strong className="text-[rgb(var(--foreground))]">Bounded & smoothed:</strong> the live shift is EWMA-smoothed and clamped, so no signal sends the date somewhere absurd.</li>
          <li>• <strong className="text-[rgb(var(--foreground))]">Cited:</strong> every factor lists its real sources; failed sources are flagged, not faked.</li>
          <li>• <strong className="text-[rgb(var(--foreground))]">Honest:</strong> a confidence band is always shown and floored to the present — this is an estimate, not a prediction of record.</li>
        </ul>
      </section>
    </PageFrame>
  );
}
