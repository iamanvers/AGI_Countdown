"use client";

import { useEffect, useMemo, useState } from "react";

import type { DefinitionId } from "@/lib/engine-state";
import { formatMonthYear } from "@/lib/format";

type HistoryPoint = {
  ts: string;
  definition: DefinitionId;
  tAgi: string;
  progress: number;
};

const MS_PER_MONTH = (365.2425 / 12) * 24 * 60 * 60 * 1000;

export function TrackRecord({ definition }: { definition: DefinitionId }) {
  const [history, setHistory] = useState<HistoryPoint[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/data/estimate_history.json", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : []))
      .then((data: HistoryPoint[]) => setHistory(Array.isArray(data) ? data : []))
      .catch(() => setHistory([]));
    return () => controller.abort();
  }, []);

  const points = useMemo(() => {
    if (!history) return [];
    return history
      .filter((point) => point.definition === definition && point.tAgi)
      .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
  }, [history, definition]);

  if (history === null) {
    return <div className="card h-[120px] animate-pulse p-5" aria-hidden />;
  }

  const first = points[0];
  const last = points[points.length - 1];
  const movedMonths =
    first && last ? (new Date(first.tAgi).getTime() - new Date(last.tAgi).getTime()) / MS_PER_MONTH : 0;
  const sooner = movedMonths > 0;
  const magnitude = Math.abs(movedMonths);

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Track record</h2>
        <span className="text-xs text-[rgb(var(--muted))] tabular">{points.length} snapshots</span>
      </div>

      {points.length < 2 || !first || !last ? (
        <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">
          Tracking just started for this definition — the movement chart fills in as snapshots
          accumulate (the git history is the long record).
        </p>
      ) : (
        <>
          <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">
            {magnitude < 0.1 ? (
              <>
                Since <span className="text-[rgb(var(--foreground))]">{formatMonthYear(first.ts)}</span>, the
                estimate has held essentially steady.
              </>
            ) : (
              <>
                Since <span className="text-[rgb(var(--foreground))]">{formatMonthYear(first.ts)}</span>, the
                estimate has moved{" "}
                <span style={{ color: sooner ? "rgb(var(--accent-rgb))" : "rgb(var(--later))" }}>
                  {magnitude.toFixed(1)} mo {sooner ? "sooner" : "later"}
                </span>
                .
              </>
            )}
          </p>
          <Sparkline points={points} />
        </>
      )}
    </section>
  );
}

function Sparkline({ points }: { points: HistoryPoint[] }) {
  const values = points.map((point) => new Date(point.tAgi).getTime());
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const W = 100;
  const H = 28;
  const coords = values.map((value, index) => {
    const x = points.length === 1 ? 0 : (index / (points.length - 1)) * W;
    // Lower tAgi (sooner) plots higher; we invert so "down" = later.
    const y = H - ((value - min) / span) * H;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return (
    <svg
      className="mt-4 w-full"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      height="40"
      role="img"
      aria-label="Estimated arrival over time"
    >
      <polyline
        points={coords.join(" ")}
        fill="none"
        style={{ stroke: "rgb(var(--accent-rgb))", strokeWidth: 1.6 }}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
