"use client";

import { useEffect, useState } from "react";

type FactorSnapshot = {
  factorId: string;
  sourceId: string;
  normalized: number;
  confidence: number;
  citation: string;
  quarantined: boolean;
};

type Signal = { id: string; label: string; tone: "accel" | "decel"; value: number; citation: string };

const HEADLINE: Array<{ id: string; label: string; tone: "accel" | "decel" }> = [
  { id: "forecast-consensus-anchor", label: "Forecast & market optimism", tone: "accel" },
  { id: "frontier-benchmark-saturation", label: "Benchmark saturation", tone: "accel" },
  { id: "autonomy-horizon", label: "Autonomy horizon", tone: "accel" },
  { id: "research-velocity", label: "Research velocity", tone: "accel" },
  { id: "public-backlash-pressure", label: "Public concern", tone: "decel" }
];

function aggregate(rows: FactorSnapshot[], id: string) {
  const list = rows.filter((row) => row.factorId === id && !row.quarantined);
  if (list.length === 0) return null;
  const totalConf = list.reduce((sum, r) => sum + Math.max(r.confidence, 1e-6), 0);
  const value = list.reduce((s, r) => s + r.normalized * Math.max(r.confidence, 1e-6), 0) / totalConf;
  const best = [...list].sort((a, b) => b.confidence - a.confidence)[0];
  return { value, citation: best?.citation ?? "#" };
}

export function LiveSignals() {
  const [signals, setSignals] = useState<Signal[] | null>(null);
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/data/factors.json", { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("no data"))))
      .then((rows: FactorSnapshot[]) => {
        const built = HEADLINE.flatMap((entry) => {
          const agg = aggregate(rows, entry.id);
          return agg ? [{ ...entry, value: agg.value, citation: agg.citation }] : [];
        });
        setSignals(built);
        setCount(new Set(rows.filter((r) => !r.quarantined).map((r) => r.sourceId)).size);
      })
      .catch(() => setSignals([]));
    return () => controller.abort();
  }, []);

  return (
    <section className="card grid content-start gap-3 p-5 backdrop-blur">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          Live signals
        </p>
        {count > 0 ? (
          <span className="text-xs text-[rgb(var(--muted))]">{count} sources</span>
        ) : null}
      </div>

      {signals === null ? (
        <p className="text-sm text-[rgb(var(--muted))]">Loading current readings…</p>
      ) : signals.length === 0 ? (
        <p className="text-sm text-[rgb(var(--muted))]">Signals unavailable.</p>
      ) : (
        <div className="grid gap-3">
          {signals.map((signal) => (
            <a
              className="focus-ring group grid gap-1 rounded-sm"
              href={signal.citation}
              key={signal.id}
              rel="noreferrer"
              target="_blank"
            >
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-[rgb(var(--muted))] group-hover:text-[rgb(var(--foreground))]">
                  {signal.label}
                </span>
                <span className="font-mono tabular">{Math.round(signal.value * 100)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[rgb(var(--panel-strong)/0.8)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(2, signal.value * 100))}%`,
                    background: signal.tone === "decel" ? "rgb(var(--later))" : "rgb(var(--accent-rgb))"
                  }}
                />
              </div>
            </a>
          ))}
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
            Current readings (0–100) feeding the clock — higher is stronger.{" "}
            <span style={{ color: "rgb(var(--accent-rgb))" }}>Accent</span> bars pull the date sooner;{" "}
            <span style={{ color: "rgb(var(--later))" }}>amber</span> bars push it later. Tap any
            signal for its source.
          </p>
        </div>
      )}
    </section>
  );
}
