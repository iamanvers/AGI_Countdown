import type { EstimatePoint } from "@/lib/static-data";

const SERIES: Array<{ id: EstimatePoint["definition"]; label: string; color: string }> = [
  { id: "weak-agi", label: "Weak AGI", color: "rgb(34 197 94)" },
  { id: "transformative-ai", label: "Transformative", color: "rgb(244 159 10)" },
  { id: "strong-agi", label: "Strong AGI", color: "rgb(239 68 68)" }
];

const W = 720;
const H = 260;
const PAD = { top: 16, right: 16, bottom: 28, left: 40 };

function decimalYear(iso: string) {
  const d = new Date(iso);
  const start = Date.UTC(d.getUTCFullYear(), 0, 1);
  const end = Date.UTC(d.getUTCFullYear() + 1, 0, 1);
  return d.getUTCFullYear() + (d.getTime() - start) / (end - start);
}

/**
 * Server-rendered, dependency-free line chart of the projected AGI *year* over
 * successive runs — i.e. how the estimate has moved. One line per definition.
 */
export function EstimateHistoryChart({ history }: { history: EstimatePoint[] }) {
  const seriesData = SERIES.map((series) => ({
    ...series,
    points: history
      .filter((point) => point.definition === series.id)
      .slice(-80)
      .map((point) => decimalYear(point.tAgi))
  }));

  const maxLen = Math.max(0, ...seriesData.map((series) => series.points.length));

  if (maxLen < 2) {
    return (
      <p className="rounded-lg border border-[rgb(var(--line)/0.6)] bg-[rgb(var(--panel)/0.5)] p-5 text-sm text-[rgb(var(--muted))]">
        The estimate-history chart fills in as the scheduled pipeline accumulates runs. Check back
        after a few refreshes.
      </p>
    );
  }

  const allYears = seriesData.flatMap((series) => series.points);
  const minY = Math.floor(Math.min(...allYears));
  const maxY = Math.ceil(Math.max(...allYears));
  const span = Math.max(1, maxY - minY);

  const xAt = (i: number) =>
    PAD.left + (maxLen === 1 ? 0 : (i / (maxLen - 1)) * (W - PAD.left - PAD.right));
  const yAt = (year: number) =>
    PAD.top + (1 - (year - minY) / span) * (H - PAD.top - PAD.bottom);

  const yTicks = Array.from({ length: span + 1 }, (_, i) => minY + i).filter(
    (_, i, arr) => arr.length <= 8 || i % Math.ceil(arr.length / 8) === 0
  );

  return (
    <figure className="grid gap-3 rounded-lg border border-[rgb(var(--line)/0.66)] bg-[rgb(var(--panel)/0.5)] p-5">
      <svg
        className="w-full"
        height={H}
        role="img"
        aria-label="Projected AGI year over successive pipeline runs, per definition"
        viewBox={`0 0 ${W} ${H}`}
      >
        {yTicks.map((year) => (
          <g key={year}>
            <line
              stroke="rgb(255 255 255 / 0.08)"
              x1={PAD.left}
              x2={W - PAD.right}
              y1={yAt(year)}
              y2={yAt(year)}
            />
            <text fill="rgb(162 158 146)" fontSize="11" x={4} y={yAt(year) + 4}>
              {year}
            </text>
          </g>
        ))}

        {seriesData.map((series) =>
          series.points.length >= 2 ? (
            <polyline
              key={series.id}
              fill="none"
              stroke={series.color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              points={series.points.map((year, i) => `${xAt(i)},${yAt(year)}`).join(" ")}
            />
          ) : null
        )}

        {seriesData.map((series) => {
          const last = series.points.at(-1);
          if (last === undefined) return null;
          return (
            <circle
              key={`${series.id}-dot`}
              cx={xAt(series.points.length - 1)}
              cy={yAt(last)}
              fill={series.color}
              r={3}
            />
          );
        })}
      </svg>

      <figcaption className="flex flex-wrap items-center gap-4 text-xs text-[rgb(var(--muted))]">
        {seriesData.map((series) => {
          const last = series.points.at(-1);
          return (
            <span className="inline-flex items-center gap-2" key={series.id}>
              <span className="h-2 w-2 rounded-full" style={{ background: series.color }} />
              {series.label}
              {last !== undefined ? (
                <span className="font-mono tabular text-[rgb(var(--foreground))]">
                  ~{Math.round(last)}
                </span>
              ) : null}
            </span>
          );
        })}
        <span className="ml-auto">projected arrival year · last {maxLen} runs</span>
      </figcaption>
    </figure>
  );
}
