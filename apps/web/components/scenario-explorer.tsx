"use client";

import { useMemo, useState } from "react";

import { formatMonths, formatQuarterYear } from "@/lib/format";

type DefId = "weak-agi" | "transformative-ai" | "strong-agi";

export type ScenarioDef = {
  id: DefId;
  name: string;
  anchorIso: string;
  baselineDeltaMonths: number;
  maxShiftMonths: number;
};

export type ScenarioFactor = {
  id: string;
  label: string;
  sign: 1 | -1;
  level: number; // 0..1 current reading
  contributionMonths: Record<string, number>;
};

const MS_PER_MONTH = (365.2425 / 12) * 24 * 60 * 60 * 1000;

// Mirror of the engine's per-role response curve (accelerators linear, decelerators √).
function curve(reading: number, sign: 1 | -1): number {
  const x = Math.min(1, Math.max(0, reading));
  return sign === -1 ? Math.sqrt(x) : x;
}

export function ScenarioExplorer({
  definitions,
  factors
}: {
  definitions: ScenarioDef[];
  factors: ScenarioFactor[];
}) {
  const [active, setActive] = useState<DefId>("transformative-ai");
  const [overrides, setOverrides] = useState<Record<string, number>>({});

  const def = definitions.find((d) => d.id === active) ?? definitions[0];

  // The biggest current movers make the most instructive sliders.
  const sliders = useMemo(
    () =>
      [...factors]
        .filter((f) => Math.abs(f.contributionMonths[active] ?? 0) > 0.03 && f.level > 0.02)
        .sort((a, b) => Math.abs(b.contributionMonths[active] ?? 0) - Math.abs(a.contributionMonths[active] ?? 0))
        .slice(0, 7),
    [factors, active]
  );

  const result = useMemo(() => {
    if (!def) return null;
    let delta = def.baselineDeltaMonths;
    for (const factor of sliders) {
      const current = factor.contributionMonths[active] ?? 0;
      const overridePct = overrides[factor.id];
      if (overridePct === undefined) continue;
      const newReading = overridePct / 100;
      const denom = curve(factor.level, factor.sign);
      if (denom <= 1e-6) continue;
      const scaled = current * (curve(newReading, factor.sign) / denom);
      delta += scaled - current;
    }
    const clamped = Math.max(-def.maxShiftMonths, Math.min(def.maxShiftMonths, delta));
    const anchorMs = new Date(def.anchorIso).getTime();
    const dateMs = Math.max(anchorMs + clamped * MS_PER_MONTH, Date.now() + MS_PER_MONTH);
    return { delta: clamped, dateMs, moved: clamped - def.baselineDeltaMonths };
  }, [def, sliders, overrides, active]);

  const dirty = Object.keys(overrides).length > 0;

  if (!def || !result) return null;

  return (
    <div data-definition={active} className="card grid gap-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-[rgb(var(--line))] bg-[rgb(var(--panel)/0.6)] p-1">
          {definitions.map((d) => {
            const on = d.id === active;
            return (
              <button
                className={`focus-ring rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  on ? "text-[rgb(var(--background))]" : "text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]"
                }`}
                key={d.id}
                onClick={() => {
                  setActive(d.id);
                  setOverrides({});
                }}
                style={on ? { background: "rgb(var(--accent-rgb))" } : undefined}
                type="button"
              >
                {d.name}
              </button>
            );
          })}
        </div>
        {dirty ? (
          <button
            className="focus-ring rounded-md px-3 py-1.5 text-xs text-[rgb(var(--muted))] underline-offset-2 hover:text-[rgb(var(--foreground))] hover:underline"
            onClick={() => setOverrides({})}
            type="button"
          >
            Reset to live
          </button>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(220px,0.55fr)]">
        <div className="grid gap-3">
          {sliders.map((factor) => {
            const reading = overrides[factor.id] ?? Math.round(factor.level * 100);
            return (
              <div className="grid gap-1" key={factor.id}>
                <div className="flex items-center justify-between text-sm">
                  <span>
                    {factor.label}{" "}
                    <span className="text-xs text-[rgb(var(--muted))]">
                      {factor.sign === 1 ? "↑" : "↓"}
                    </span>
                  </span>
                  <span className="tabular text-xs text-[rgb(var(--muted))]">{reading}/100</span>
                </div>
                <input
                  aria-label={`${factor.label} reading`}
                  className="accent-[rgb(var(--accent-rgb))]"
                  max={100}
                  min={0}
                  onChange={(event) =>
                    setOverrides((current) => ({ ...current, [factor.id]: Number(event.target.value) }))
                  }
                  type="range"
                  value={reading}
                />
              </div>
            );
          })}
        </div>

        <div className="grid content-start gap-2 rounded-xl border border-[rgb(var(--line)/0.7)] bg-[rgb(var(--panel-strong)/0.5)] p-5">
          <p className="text-[0.66rem] uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Resulting estimate</p>
          <p className="gradient-text text-4xl font-bold tabular">≈ {formatQuarterYear(new Date(result.dateMs).toISOString())}</p>
          <p className="text-sm text-[rgb(var(--muted))]">
            {Math.abs(result.moved) < 0.1 ? (
              "Same as live — drag a slider to explore."
            ) : (
              <>
                <span style={{ color: result.moved < 0 ? "rgb(var(--accent-rgb))" : "rgb(var(--later))" }}>
                  {formatMonths(result.moved)} {result.moved < 0 ? "sooner" : "later"}
                </span>{" "}
                than live
              </>
            )}
          </p>
          <p className="mt-2 border-t border-[rgb(var(--line)/0.5)] pt-2 text-[0.7rem] leading-5 text-[rgb(var(--muted))]">
            Approximate: applies the engine&apos;s response curves and ±{def.maxShiftMonths}-mo clamp, but
            not smoothing or anchor re-blending. For intuition, not a second forecast.
          </p>
        </div>
      </div>
    </div>
  );
}
