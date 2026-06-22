"use client";

import { useMemo, useState } from "react";

import { formatArrivalRange, formatMonthYear, formatMonths, formatQuarterYear } from "@/lib/format";

type DefId = "weak-agi" | "transformative-ai" | "strong-agi";

export type FlowFactor = {
  id: string;
  label: string;
  sign: 1 | -1;
  weight: number;
  domain: string;
  category: "internal" | "external";
  level: number | null; // 0..1 raw reading
  contributionMonths: Record<string, number>;
  sources: Array<{ id: string; name: string; url: string }>;
};

export type FlowOutput = {
  tAgi: string;
  anchor: string;
  deltaMonths: number;
  progress: number;
  band: { earlyP10: string; lateP90: string };
};

type FlowGraphProps = {
  definitions: Array<{ id: DefId; name: string }>;
  factors: FlowFactor[];
  outputs: Record<DefId, FlowOutput>;
};

// viewBox geometry
const W = 960;
const COL1 = { x: 12, w: 250 };
const COL2 = { x: 432, w: 150 };
const COL3 = { x: 726, w: 222 };
const TOP = 16;
const FACTOR_H = 26;
const FACTOR_STEP = 32;
const FORECAST_H = 46;

const FG = "rgb(var(--foreground))";
const MUTED = "rgb(var(--muted))";
const LINE = "rgb(var(--line))";
const PANEL = "rgb(var(--panel))";
const PANEL_STRONG = "rgb(var(--panel-strong))";
const ACCENT = "rgb(var(--accent-rgb))";
const LATER = "rgb(var(--later))";

function edgePath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
}

export function EngineFlowGraph({ definitions, factors, outputs }: FlowGraphProps) {
  const [active, setActive] = useState<DefId>("transformative-ai");
  const [focus, setFocus] = useState<string | null>(null);

  const layout = useMemo(() => {
    const ranked = [...factors].sort(
      (a, b) => Math.abs(b.contributionMonths[active] ?? 0) - Math.abs(a.contributionMonths[active] ?? 0)
    );
    const maxAbs = Math.max(0.0001, ...ranked.map((f) => Math.abs(f.contributionMonths[active] ?? 0)));
    const fy0 = TOP + FORECAST_H + 34;
    const nodes = ranked.map((factor, i) => ({
      factor,
      x: COL1.x,
      y: fy0 + i * FACTOR_STEP,
      contribution: factor.contributionMonths[active] ?? 0
    }));
    const factorsBottom = nodes.length ? fy0 + (nodes.length - 1) * FACTOR_STEP + FACTOR_H : fy0;
    const height = Math.max(factorsBottom + 16, 480);

    const forecastCy = TOP + FORECAST_H / 2;
    const anchorNode = { x: COL2.x, y: forecastCy - 27, h: 54, cy: forecastCy };
    const deltaCy = (fy0 + factorsBottom) / 2;
    const deltaNode = { x: COL2.x, y: deltaCy - 38, h: 76, cy: deltaCy };
    const outCy = (anchorNode.cy + deltaNode.cy) / 2;
    const outNode = { x: COL3.x, y: outCy - 78, h: 156, cy: outCy };

    return { nodes, maxAbs, height, forecastCy, anchorNode, deltaNode, outNode };
  }, [factors, active]);

  const out = outputs[active];
  const sooner = out.deltaMonths < 0;
  const focusFactor = focus ? factors.find((f) => f.id === focus) ?? null : null;
  const focusContribution = focusFactor ? focusFactor.contributionMonths[active] ?? 0 : 0;

  const strokeFor = (contribution: number) =>
    Math.abs(contribution) < 1e-6 ? MUTED : contribution < 0 ? ACCENT : LATER;
  const widthFor = (contribution: number) => 1.5 + 12 * Math.min(1, Math.abs(contribution) / layout.maxAbs);

  return (
    <div data-definition={active} className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-[rgb(var(--line))] bg-[rgb(var(--panel)/0.6)] p-1">
          {definitions.map((def) => {
            const on = def.id === active;
            return (
              <button
                className={`focus-ring rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  on ? "text-[rgb(var(--background))]" : "text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]"
                }`}
                key={def.id}
                onClick={() => setActive(def.id)}
                style={on ? { background: ACCENT } : undefined}
                type="button"
              >
                {def.name}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-4 text-xs text-[rgb(var(--muted))]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full" style={{ background: ACCENT }} /> pulls sooner
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full" style={{ background: LATER }} /> pushes later
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[rgb(var(--line))] bg-[rgb(var(--panel)/0.45)]">
        <svg
          className="block min-w-[760px]"
          role="img"
          aria-label={`Flow of factors into the ${active} estimate`}
          viewBox={`0 0 ${W} ${layout.height}`}
          width="100%"
        >
          {/* structural edges */}
          <path
            d={edgePath(COL1.x + COL1.w, layout.forecastCy, COL2.x, layout.anchorNode.cy)}
            fill="none"
            style={{ stroke: MUTED, strokeOpacity: 0.5 }}
            strokeWidth={3}
          />
          <path
            d={edgePath(COL2.x + COL2.w, layout.anchorNode.cy, COL3.x, layout.outNode.cy - 24)}
            fill="none"
            style={{ stroke: MUTED, strokeOpacity: 0.5 }}
            strokeWidth={3}
          />
          <path
            d={edgePath(COL2.x + COL2.w, layout.deltaNode.cy, COL3.x, layout.outNode.cy + 24)}
            fill="none"
            style={{ stroke: strokeFor(out.deltaMonths), strokeOpacity: 0.85 }}
            strokeWidth={2 + 6 * Math.min(1, Math.abs(out.deltaMonths) / 36)}
          />

          {/* factor -> Δ edges */}
          {layout.nodes.map(({ factor, x, y, contribution }) => {
            const dim = focus !== null && focus !== factor.id;
            return (
              <path
                className="flow-edge"
                d={edgePath(x + COL1.w, y + FACTOR_H / 2, COL2.x, layout.deltaNode.cy)}
                fill="none"
                key={`edge-${factor.id}`}
                style={{
                  stroke: strokeFor(contribution),
                  strokeOpacity: dim ? 0.12 : focus === factor.id ? 0.95 : 0.55
                }}
                strokeWidth={widthFor(contribution)}
              />
            );
          })}

          {/* input + aggregator nodes */}
          <FlowNode x={COL1.x} y={TOP} w={COL1.w} h={FORECAST_H} title="Forecast consensus" subtitle="Metaculus · markets · experts · compute" tone="neutral" />
          <FlowNode x={COL2.x} y={layout.anchorNode.y} w={COL2.w} h={layout.anchorNode.h} title="Anchor" subtitle={formatMonthYear(out.anchor)} tone="neutral" />
          <FlowNode
            x={COL2.x}
            y={layout.deltaNode.y}
            w={COL2.w}
            h={layout.deltaNode.h}
            title="Δ factors"
            subtitle={`${formatMonths(out.deltaMonths)} ${sooner ? "sooner" : "later"}`}
            tone={sooner ? "accent" : "later"}
          />

          {/* output clock node */}
          <g>
            <rect
              x={COL3.x}
              y={layout.outNode.y}
              width={COL3.w}
              height={layout.outNode.h}
              rx={12}
              style={{ fill: PANEL_STRONG, stroke: ACCENT, strokeOpacity: 0.7 }}
            />
            <text x={COL3.x + 16} y={layout.outNode.y + 26} style={{ fill: MUTED, letterSpacing: "0.12em" }} fontSize={11}>
              ESTIMATED ARRIVAL
            </text>
            <text x={COL3.x + 16} y={layout.outNode.y + 58} style={{ fill: FG }} fontSize={26} fontWeight={700}>
              ≈ {formatQuarterYear(out.tAgi)}
            </text>
            <text x={COL3.x + 16} y={layout.outNode.y + 84} style={{ fill: MUTED }} fontSize={12}>
              80% window {formatArrivalRange(out.band.earlyP10, out.band.lateP90)}
            </text>
            <text x={COL3.x + 16} y={layout.outNode.y + 116} style={{ fill: MUTED, letterSpacing: "0.1em" }} fontSize={11}>
              CAPABILITY {Math.round(out.progress)} / 100
            </text>
            <rect x={COL3.x + 16} y={layout.outNode.y + 124} width={COL3.w - 32} height={6} rx={3} style={{ fill: PANEL }} />
            <rect
              x={COL3.x + 16}
              y={layout.outNode.y + 124}
              width={(COL3.w - 32) * Math.min(1, out.progress / 100)}
              height={6}
              rx={3}
              style={{ fill: ACCENT }}
            />
          </g>

          {/* interactive factor nodes */}
          {layout.nodes.map(({ factor, x, y, contribution }) => {
            const dim = focus !== null && focus !== factor.id;
            const accel = factor.sign === 1;
            return (
              <g
                className="cursor-pointer"
                key={`node-${factor.id}`}
                onMouseEnter={() => setFocus(factor.id)}
                onMouseLeave={() => setFocus(null)}
                onClick={() => setFocus((cur) => (cur === factor.id ? null : factor.id))}
                opacity={dim ? 0.4 : 1}
              >
                <rect
                  x={x}
                  y={y}
                  width={COL1.w}
                  height={FACTOR_H}
                  rx={6}
                  style={{
                    fill: PANEL,
                    fillOpacity: 0.9,
                    stroke: focus === factor.id ? strokeFor(contribution) : LINE,
                    strokeWidth: focus === factor.id ? 1.6 : 1
                  }}
                />
                <circle cx={x + 12} cy={y + FACTOR_H / 2} r={3.5} style={{ fill: accel ? ACCENT : LATER }} />
                <text x={x + 24} y={y + 17} style={{ fill: FG }} fontSize={12}>
                  {factor.label.length > 26 ? `${factor.label.slice(0, 25)}…` : factor.label}
                </text>
                <text x={x + COL1.w - 10} y={y + 17} textAnchor="end" style={{ fill: MUTED }} fontSize={11}>
                  {contribution < 0 ? "" : "+"}
                  {contribution.toFixed(1)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* detail strip */}
      <div className="min-h-[64px] rounded-lg border border-[rgb(var(--line)/0.7)] bg-[rgb(var(--panel)/0.55)] p-4 text-sm">
        {focusFactor ? (
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">{focusFactor.label}</span>
              <span className="tabular text-xs" style={{ color: focusContribution < 0 ? ACCENT : LATER }}>
                {focusContribution < 0 ? "pulls sooner" : "pushes later"} · {formatMonths(focusContribution)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[rgb(var(--muted))]">
              <span>{focusFactor.sign === 1 ? "↑ accelerator" : "↓ decelerator"}</span>
              <span>weight {focusFactor.weight}</span>
              {focusFactor.level !== null ? <span>reading {Math.round(focusFactor.level * 100)}/100</span> : null}
              <span>{focusFactor.domain}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {focusFactor.sources.map((s) => (
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
          </div>
        ) : (
          <p className="text-[rgb(var(--muted))]">
            Hover or tap a factor to trace how it flows into{" "}
            <span className="text-[rgb(var(--foreground))]">Δ factors</span> and shifts the date. Edge
            thickness = size of this run&apos;s contribution; colour = sooner (accent) vs later (amber).
          </p>
        )}
      </div>
    </div>
  );
}

function FlowNode({
  x,
  y,
  w,
  h,
  title,
  subtitle,
  tone
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  subtitle: string;
  tone: "neutral" | "accent" | "later";
}) {
  const stroke = tone === "accent" ? ACCENT : tone === "later" ? LATER : LINE;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} style={{ fill: PANEL_STRONG, stroke, strokeOpacity: 0.8 }} />
      <text x={x + w / 2} y={y + h / 2 - 4} textAnchor="middle" style={{ fill: FG }} fontSize={14} fontWeight={600}>
        {title}
      </text>
      <text x={x + w / 2} y={y + h / 2 + 14} textAnchor="middle" style={{ fill: MUTED }} fontSize={11}>
        {subtitle}
      </text>
    </g>
  );
}
