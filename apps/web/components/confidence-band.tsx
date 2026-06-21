import type { EngineState } from "@/lib/engine-state";
import { clamp } from "@/lib/engine-state";
import { formatDate, formatDateTime, formatMonths } from "@/lib/format";

type ConfidenceBandProps = {
  state: EngineState;
};

export function ConfidenceBand({ state }: ConfidenceBandProps) {
  const early = new Date(state.band.earlyP10).getTime();
  const late = new Date(state.band.lateP90).getTime();
  const target = new Date(state.tAgi).getTime();
  const hasValidRange = Number.isFinite(early) && Number.isFinite(late) && Number.isFinite(target) && late > early;
  const span = hasValidRange ? late - early : 1;
  const marker = hasValidRange ? clamp(((target - early) / span) * 100, 0, 100) : 50;
  const shiftDirection = state.deltaMonths < 0 ? "sooner" : state.deltaMonths > 0 ? "later" : "from anchor";

  return (
    <section className="rounded-lg border border-[rgb(var(--line)/0.7)] bg-[rgb(var(--panel)/0.72)] p-5 backdrop-blur">
      <div className="flex items-start justify-between gap-5">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
            Confidence Band
          </h2>
          <p className="mt-2 text-lg font-medium tabular">{formatDate(state.band.earlyP10)} - {formatDate(state.band.lateP90)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Target</p>
          <p className="mt-1 text-sm font-semibold tabular">{formatDateTime(state.tAgi)}</p>
        </div>
      </div>

      <div className="relative mt-6 h-4 rounded-full bg-[rgb(var(--panel-strong))]">
        <div className="absolute inset-y-0 left-[8%] right-[8%] rounded-full bg-gradient-to-r from-emerald-500/65 via-[rgb(var(--accent-rgb)/0.72)] to-red-500/65" />
        <div
          className="absolute top-1/2 h-7 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgb(var(--foreground))] shadow-glow"
          style={{ left: `${marker}%` }}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-[rgb(var(--muted))]">
        <span>Anchor: <span className="font-medium text-[rgb(var(--foreground))]">{formatDate(state.anchor)}</span></span>
        <span>
          Shift:{" "}
          <span className={state.deltaMonths <= 0 ? "text-emerald-400" : "text-red-400"}>
            {formatMonths(state.deltaMonths)} {shiftDirection}
          </span>
        </span>
      </div>
    </section>
  );
}
