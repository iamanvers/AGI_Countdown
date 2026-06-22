import type { EngineState } from "@/lib/engine-state";
import { clamp } from "@/lib/engine-state";
import { formatMonthYear, formatMonths } from "@/lib/format";

type ConfidenceBandProps = {
  state: EngineState;
};

export function ConfidenceBand({ state }: ConfidenceBandProps) {
  const early = new Date(state.band.earlyP10).getTime();
  const late = new Date(state.band.lateP90).getTime();
  const target = new Date(state.tAgi).getTime();
  const valid = Number.isFinite(early) && Number.isFinite(late) && Number.isFinite(target) && late > early;
  const span = valid ? late - early : 1;
  const pos = (ms: number) => clamp(((ms - early) / span) * 100, 0, 100);
  const marker = valid ? pos(target) : 50;
  const sooner = state.deltaMonths < 0;

  // Inner "likely" band (~P25–P75), if the engine emitted it.
  const likelyEarly = state.band.likelyEarly ? new Date(state.band.likelyEarly).getTime() : null;
  const likelyLate = state.band.likelyLate ? new Date(state.band.likelyLate).getTime() : null;
  const hasInner =
    valid && likelyEarly !== null && likelyLate !== null && Number.isFinite(likelyEarly) && Number.isFinite(likelyLate);
  const innerLeft = hasInner ? pos(likelyEarly as number) : 0;
  const innerRight = hasInner ? pos(likelyLate as number) : 100;

  return (
    <section className="card p-5 backdrop-blur">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
        Confidence band
      </h2>
      <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
        Outer bar = ~80% range (earliest to latest plausible). The brighter inner band is the
        more-likely-than-not window.
      </p>

      <div className="relative mt-5 h-3 rounded-full bg-[rgb(var(--panel-strong))]">
        <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-gradient-to-r from-[rgb(var(--sooner)/0.28)] via-[rgb(var(--accent-rgb)/0.32)] to-[rgb(var(--later)/0.28)]" />
        {hasInner ? (
          <div
            className="absolute inset-y-0 rounded-full bg-gradient-to-r from-[rgb(var(--accent-rgb)/0.85)] to-[rgb(var(--accent-rgb)/0.6)] shadow-[0_0_12px_-2px_rgb(var(--accent-rgb)/0.8)]"
            style={{ left: `${innerLeft}%`, right: `${100 - innerRight}%` }}
            title="Likely (more probable than not) window"
          />
        ) : null}
        <div
          className="absolute top-1/2 h-6 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgb(var(--foreground))]"
          style={{ left: `${marker}%` }}
          title="Central estimate"
        />
      </div>

      {hasInner ? (
        <p className="mt-2.5 text-center text-xs text-[rgb(var(--muted))]">
          Likely{" "}
          <span className="font-medium text-[rgb(var(--foreground))] tabular">
            {formatMonthYear(state.band.likelyEarly as string)} – {formatMonthYear(state.band.likelyLate as string)}
          </span>
        </p>
      ) : null}

      <div className="mt-3 flex items-start justify-between gap-4 text-sm">
        <div>
          <p className="text-[0.66rem] uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Earliest</p>
          <p className="mt-0.5 font-medium tabular">{formatMonthYear(state.band.earlyP10)}</p>
        </div>
        <div className="text-center">
          <p className="text-[0.66rem] uppercase tracking-[0.14em] text-[rgb(var(--accent-rgb))]">Estimate</p>
          <p className="mt-0.5 font-semibold tabular">{formatMonthYear(state.tAgi)}</p>
        </div>
        <div className="text-right">
          <p className="text-[0.66rem] uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Latest</p>
          <p className="mt-0.5 font-medium tabular">{formatMonthYear(state.band.lateP90)}</p>
        </div>
      </div>

      <p className="mt-4 border-t border-[rgb(var(--line)/0.5)] pt-3 text-xs text-[rgb(var(--muted))]">
        Anchored at <span className="text-[rgb(var(--foreground))]">{formatMonthYear(state.anchor)}</span>,
        live signals currently pull it{" "}
        <span style={{ color: sooner ? "rgb(var(--accent-rgb))" : "rgb(var(--later))" }}>
          {formatMonths(state.deltaMonths)} {sooner ? "sooner" : "later"}
        </span>
        .
      </p>
    </section>
  );
}
