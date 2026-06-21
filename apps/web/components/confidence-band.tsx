import type { EngineState } from "@/lib/engine-state";
import { clamp } from "@/lib/engine-state";
import { formatDate, formatMonths } from "@/lib/format";

type ConfidenceBandProps = {
  state: EngineState;
};

export function ConfidenceBand({ state }: ConfidenceBandProps) {
  const early = new Date(state.band.earlyP10).getTime();
  const late = new Date(state.band.lateP90).getTime();
  const target = new Date(state.tAgi).getTime();
  const valid = Number.isFinite(early) && Number.isFinite(late) && Number.isFinite(target) && late > early;
  const span = valid ? late - early : 1;
  const marker = valid ? clamp(((target - early) / span) * 100, 0, 100) : 50;
  const sooner = state.deltaMonths < 0;

  return (
    <section className="rounded-lg border border-[rgb(var(--line)/0.7)] bg-[rgb(var(--panel)/0.72)] p-5 backdrop-blur">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
        Confidence band
      </h2>
      <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
        The range we&apos;d put roughly 80% odds on — earliest to latest plausible arrival.
      </p>

      <div className="relative mt-5 h-3 rounded-full bg-[rgb(var(--panel-strong))]">
        <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-gradient-to-r from-[rgb(var(--sooner)/0.55)] via-[rgb(var(--accent-rgb)/0.7)] to-[rgb(var(--later)/0.55)]" />
        <div
          className="absolute top-1/2 h-6 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgb(var(--foreground))]"
          style={{ left: `${marker}%` }}
          title="Central estimate"
        />
      </div>

      <div className="mt-3 flex items-start justify-between gap-4 text-sm">
        <div>
          <p className="text-[0.66rem] uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Earliest</p>
          <p className="mt-0.5 font-medium tabular">{formatDate(state.band.earlyP10)}</p>
        </div>
        <div className="text-center">
          <p className="text-[0.66rem] uppercase tracking-[0.14em] text-[rgb(var(--accent-rgb))]">Estimate</p>
          <p className="mt-0.5 font-semibold tabular">{formatDate(state.tAgi)}</p>
        </div>
        <div className="text-right">
          <p className="text-[0.66rem] uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Latest</p>
          <p className="mt-0.5 font-medium tabular">{formatDate(state.band.lateP90)}</p>
        </div>
      </div>

      <p className="mt-4 border-t border-[rgb(var(--line)/0.5)] pt-3 text-xs text-[rgb(var(--muted))]">
        Anchored at <span className="text-[rgb(var(--foreground))]">{formatDate(state.anchor)}</span>,
        live signals currently pull it{" "}
        <span style={{ color: sooner ? "rgb(var(--accent-rgb))" : "rgb(var(--later))" }}>
          {formatMonths(state.deltaMonths)} {sooner ? "sooner" : "later"}
        </span>
        .
      </p>
    </section>
  );
}
