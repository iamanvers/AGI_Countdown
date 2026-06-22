"use client";

import { useMemo, useState } from "react";

import { formatMonthYear, formatMonths } from "@/lib/format";

type DefId = "weak-agi" | "transformative-ai" | "strong-agi";

export type ForecasterDef = {
  id: DefId;
  name: string;
  anchorIso: string;
  tAgiIso: string;
  deltaMonths: number;
  blend: Array<{ bucket: string; label: string; median: string; weight: number; citation: string }>;
};

const YEAR_MS = 365.2425 * 24 * 60 * 60 * 1000;

export function ForecasterComparison({ definitions }: { definitions: ForecasterDef[] }) {
  const [active, setActive] = useState<DefId>("transformative-ai");
  const def = definitions.find((d) => d.id === active) ?? definitions[0];

  const view = useMemo(() => {
    if (!def) return null;
    const points = def.blend
      .map((b) => ({ ...b, ms: new Date(b.median).getTime() }))
      .filter((b) => Number.isFinite(b.ms));
    const anchorMs = new Date(def.anchorIso).getTime();
    const tAgiMs = new Date(def.tAgiIso).getTime();
    const all = [...points.map((p) => p.ms), anchorMs, tAgiMs];
    const min = Math.min(...all) - 0.4 * YEAR_MS;
    const max = Math.max(...all) + 0.4 * YEAR_MS;
    const span = max - min || 1;
    const pos = (ms: number) => ((ms - min) / span) * 100;
    return { points, anchorMs, tAgiMs, min, max, pos };
  }, [def]);

  if (!def || !view) return null;
  const sooner = def.deltaMonths < 0;

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
                onClick={() => setActive(d.id)}
                style={on ? { background: "rgb(var(--accent-rgb))" } : undefined}
                type="button"
              >
                {d.name}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-[rgb(var(--muted))]">dot = each forecast&apos;s median</p>
      </div>

      <div className="grid gap-2">
        {view.points.map((point) => (
          <Row key={point.bucket} label={point.label} leftPct={view.pos(point.ms)} ms={point.ms} sub={`weight ${Math.round(point.weight * 100)}%`} citation={point.citation} />
        ))}
        <Row label="Our anchor (weighted blend)" leftPct={view.pos(view.anchorMs)} ms={view.anchorMs} tone="anchor" />
        <Row label="Estimate (anchor + live signals)" leftPct={view.pos(view.tAgiMs)} ms={view.tAgiMs} tone="estimate" />
      </div>

      <p className="border-t border-[rgb(var(--line)/0.5)] pt-3 text-sm leading-6 text-[rgb(var(--muted))]">
        We start from the <span className="text-[rgb(var(--foreground))]">weighted blend</span> of those four
        forecasts, then our live signals move it{" "}
        <span style={{ color: sooner ? "rgb(var(--accent-rgb))" : "rgb(var(--later))" }}>
          {formatMonths(def.deltaMonths)} {sooner ? "sooner" : "later"}
        </span>{" "}
        to <span className="text-[rgb(var(--foreground))]">{formatMonthYear(def.tAgiIso)}</span>. That shift —
        not the average — is what makes this more than a poll of other people&apos;s numbers.
      </p>
    </div>
  );
}

function Row({
  label,
  leftPct,
  ms,
  sub,
  citation,
  tone
}: {
  label: string;
  leftPct: number;
  ms: number;
  sub?: string;
  citation?: string;
  tone?: "anchor" | "estimate";
}) {
  const dotColor =
    tone === "estimate" ? "rgb(var(--accent-rgb))" : tone === "anchor" ? "rgb(var(--foreground))" : "rgb(var(--muted))";
  const labelNode = (
    <span className={tone ? "font-medium text-[rgb(var(--foreground))]" : "text-[rgb(var(--muted))]"}>{label}</span>
  );
  return (
    <div className="grid items-center gap-2 sm:grid-cols-[minmax(0,200px)_1fr_64px] sm:gap-4">
      <div className="text-sm">
        {citation ? (
          <a className="focus-ring rounded-sm hover:text-[rgb(var(--accent-rgb))]" href={citation} rel="noreferrer" target="_blank">
            {labelNode}
          </a>
        ) : (
          labelNode
        )}
        {sub ? <span className="ml-2 text-xs text-[rgb(var(--muted))]">{sub}</span> : null}
      </div>
      <div className="relative h-5">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[rgb(var(--line)/0.7)]" />
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: `${leftPct}%`,
            width: tone ? 12 : 9,
            height: tone ? 12 : 9,
            background: dotColor,
            boxShadow: tone === "estimate" ? "0 0 10px -1px rgb(var(--accent-rgb)/0.8)" : undefined
          }}
        />
      </div>
      <span className="text-right text-xs tabular text-[rgb(var(--muted))]">{new Date(ms).getUTCFullYear()}</span>
    </div>
  );
}
