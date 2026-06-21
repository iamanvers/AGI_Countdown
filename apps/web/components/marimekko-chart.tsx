import type { JobsSector } from "@/lib/static-data";

function shade(exposure: number) {
  const a = 0.32 + Math.min(1, exposure / 100) * 0.55;
  return `rgb(var(--accent-rgb) / ${a.toFixed(2)})`;
}

/**
 * Marimekko, in plain HTML/CSS (no SVG scaling, so text never squishes):
 * each sector column's WIDTH is its share of the workforce and its filled
 * HEIGHT is its AI automation exposure.
 */
export function MarimekkoChart({ sectors }: { sectors: JobsSector[] }) {
  const ordered = [...sectors].sort((a, b) => b.workforceSharePct - a.workforceSharePct);
  const total = ordered.reduce((sum, s) => sum + s.workforceSharePct, 0) || 100;

  return (
    <figure className="grid gap-5 rounded-xl border border-[rgb(var(--line))] bg-[rgb(var(--panel)/0.55)] p-5 sm:p-6">
      <div className="relative h-[260px] w-full pl-9">
        {/* gridlines */}
        {[0, 25, 50, 75, 100].map((tick) => (
          <div
            className="absolute left-9 right-0 flex items-center"
            key={tick}
            style={{ bottom: `${tick}%` }}
          >
            <span className="absolute -left-9 w-8 text-right text-[0.62rem] tabular text-[rgb(var(--muted))]">
              {tick}
            </span>
            <span className="h-px w-full bg-[rgb(var(--line)/0.7)]" />
          </div>
        ))}

        {/* columns */}
        <div className="absolute inset-y-0 left-9 right-0 flex items-end gap-[2px]">
          {ordered.map((sector) => {
            const widthPct = (sector.workforceSharePct / total) * 100;
            return (
              <div
                className="group relative h-full"
                key={sector.sector}
                style={{ width: `${widthPct}%` }}
                title={`${sector.sector}: ${sector.automationExposurePct}% exposure · ${sector.workforceSharePct}% of workforce`}
              >
                <div className="absolute inset-x-0 bottom-0 rounded-[3px] bg-[rgb(255_255_255/0.025)]" style={{ top: 0 }} />
                <div
                  className="absolute inset-x-0 bottom-0 rounded-t-[3px] transition-[height]"
                  style={{ height: `${sector.automationExposurePct}%`, background: shade(sector.automationExposurePct) }}
                >
                  {widthPct > 6 ? (
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[0.66rem] font-semibold tabular text-[rgb(var(--foreground))]">
                      {sector.automationExposurePct}%
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
        {ordered.map((sector) => (
          <span className="inline-flex items-center gap-2 text-[rgb(var(--muted))]" key={sector.sector}>
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: shade(sector.automationExposurePct) }} />
            <span className="text-[rgb(var(--foreground))]">{sector.sector}</span>
            <span className="tabular">
              {sector.workforceSharePct}% · {sector.automationExposurePct}% exp
            </span>
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
