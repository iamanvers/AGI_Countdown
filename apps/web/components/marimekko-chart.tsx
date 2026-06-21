import type { JobsSector } from "@/lib/static-data";

const W = 1000;
const H = 360;
const PAD = { top: 24, right: 8, bottom: 8, left: 8 };
const chartW = W - PAD.left - PAD.right;
const chartH = H - PAD.top - PAD.bottom;

function shade(exposure: number) {
  // 0..100 exposure -> opacity ramp on the accent color.
  const a = 0.25 + Math.min(1, exposure / 100) * 0.7;
  return `rgb(var(--accent-rgb) / ${a.toFixed(2)})`;
}

/**
 * Marimekko (mekko) chart: each sector is a column whose WIDTH is its share of
 * the workforce and whose filled HEIGHT is its AI automation exposure. Big,
 * highly-exposed sectors show up as large blocks near the top.
 */
export function MarimekkoChart({ sectors }: { sectors: JobsSector[] }) {
  const totalShare = sectors.reduce((sum, s) => sum + s.workforceSharePct, 0) || 100;

  let cursor = PAD.left;
  const columns = sectors.map((sector) => {
    const width = (sector.workforceSharePct / totalShare) * chartW;
    const fillH = (sector.automationExposurePct / 100) * chartH;
    const col = {
      sector,
      x: cursor,
      width,
      y: PAD.top + (chartH - fillH),
      fillH
    };
    cursor += width;
    return col;
  });

  return (
    <figure className="grid gap-3 overflow-x-auto rounded-lg border border-[rgb(var(--line)/0.66)] bg-[rgb(var(--panel)/0.5)] p-5">
      <svg
        className="min-w-[640px]"
        height={H + 70}
        role="img"
        aria-label="Workforce share by sector versus AI automation exposure"
        viewBox={`0 0 ${W} ${H + 70}`}
      >
        {[0, 25, 50, 75, 100].map((tick) => {
          const y = PAD.top + (chartH - (tick / 100) * chartH);
          return (
            <g key={tick}>
              <line stroke="rgb(255 255 255 / 0.07)" x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} />
              <text fill="rgb(162 158 146)" fontSize="11" x={PAD.left} y={y - 3}>
                {tick}% exposure
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
            {col.width > 34 ? (
              <text
                fill="rgb(var(--foreground))"
                fontSize="12"
                fontWeight="600"
                textAnchor="middle"
                x={col.x + col.width / 2}
                y={col.y - 5}
              >
                {col.sector.automationExposurePct}%
              </text>
            ) : null}
            <text
              fill="rgb(162 158 146)"
              fontSize="11"
              transform={`rotate(35 ${col.x + col.width / 2} ${H + 6})`}
              x={col.x + col.width / 2}
              y={H + 6}
            >
              {col.sector.sector}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="text-xs leading-5 text-[rgb(var(--muted))]">
        Column <strong className="text-[rgb(var(--foreground))]">width</strong> = share of the
        workforce · <strong className="text-[rgb(var(--foreground))]">height</strong> = AI automation
        exposure. Large blocks high up are big sectors with high exposure.
      </figcaption>
    </figure>
  );
}
