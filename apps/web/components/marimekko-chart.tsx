import type { JobsSector } from "@/lib/static-data";

const W = 1000;
const H = 300;
const PAD = { top: 22, right: 6, bottom: 22, left: 6 };
const chartW = W - PAD.left - PAD.right;
const chartH = H - PAD.top - PAD.bottom;

function shade(exposure: number) {
  const a = 0.3 + Math.min(1, exposure / 100) * 0.6;
  return `rgb(var(--accent-rgb) / ${a.toFixed(2)})`;
}

/**
 * Marimekko: each sector is a column whose WIDTH is its share of the workforce
 * and whose filled HEIGHT is its AI automation exposure. Labels live in the
 * legend below so nothing clips.
 */
export function MarimekkoChart({ sectors }: { sectors: JobsSector[] }) {
  const ordered = [...sectors].sort((a, b) => b.workforceSharePct - a.workforceSharePct);
  const totalShare = ordered.reduce((sum, s) => sum + s.workforceSharePct, 0) || 100;

  let cursor = PAD.left;
  const columns = ordered.map((sector) => {
    const width = (sector.workforceSharePct / totalShare) * chartW;
    const fillH = (sector.automationExposurePct / 100) * chartH;
    const col = { sector, x: cursor, width, y: PAD.top + (chartH - fillH), fillH };
    cursor += width;
    return col;
  });

  return (
    <figure className="grid gap-4 rounded-lg border border-[rgb(var(--line)/0.66)] bg-[rgb(var(--panel)/0.5)] p-5">
      <svg
        className="w-full"
        role="img"
        aria-label="Workforce share by sector versus AI automation exposure"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ height: "260px" }}
      >
        {[25, 50, 75, 100].map((tick) => {
          const y = PAD.top + (chartH - (tick / 100) * chartH);
          return (
            <g key={tick}>
              <line stroke="rgb(255 255 255 / 0.06)" x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} />
              <text fill="rgb(var(--muted))" fontSize="10" x={PAD.left + 2} y={y - 3}>
                {tick}%
              </text>
            </g>
          );
        })}

        {columns.map((col) => (
          <g key={col.sector.sector}>
            <rect
              x={col.x + 1}
              y={PAD.top}
              width={Math.max(0, col.width - 2)}
              height={chartH}
              fill="rgb(255 255 255 / 0.03)"
            />
            <rect
              x={col.x + 1}
              y={col.y}
              width={Math.max(0, col.width - 2)}
              height={col.fillH}
              fill={shade(col.sector.automationExposurePct)}
            >
              <title>
                {col.sector.sector}: {col.sector.automationExposurePct}% exposure ·{" "}
                {col.sector.workforceSharePct}% of workforce
              </title>
            </rect>
            {col.width > 42 ? (
              <text
                fill="rgb(var(--foreground))"
                fontSize="12"
                fontWeight="600"
                textAnchor="middle"
                x={col.x + col.width / 2}
                y={Math.max(PAD.top + 12, col.y - 5)}
              >
                {col.sector.automationExposurePct}%
              </text>
            ) : null}
          </g>
        ))}
      </svg>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
        {ordered.map((sector) => (
          <span className="inline-flex items-center gap-2 text-[rgb(var(--muted))]" key={sector.sector}>
            <span
              className="h-2.5 w-2.5 rounded-[3px]"
              style={{ background: shade(sector.automationExposurePct) }}
            />
            <span className="text-[rgb(var(--foreground))]">{sector.sector}</span>
            {sector.workforceSharePct}% · {sector.automationExposurePct}% exp
          </span>
        ))}
      </div>

      <figcaption className="text-xs leading-5 text-[rgb(var(--muted))]">
        Column <strong className="text-[rgb(var(--foreground))]">width</strong> = share of the
        workforce; <strong className="text-[rgb(var(--foreground))]">height</strong> = AI automation
        exposure. Tall, wide blocks are big sectors with high exposure.
      </figcaption>
    </figure>
  );
}
