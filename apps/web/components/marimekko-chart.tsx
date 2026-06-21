import type { JobsSector } from "@/lib/static-data";

// Muted "Citi blue" variations — distinct per sector so the legend and columns
// are tellable apart. Height (not color) encodes exposure.
const BLUE_RAMP = [
  "#8fb6df",
  "#79a6d6",
  "#6597cc",
  "#5388c0",
  "#4579b0",
  "#3c6c9f",
  "#356090",
  "#2f547e",
  "#29496c",
  "#243e5b",
  "#20364d"
];

export function MarimekkoChart({ sectors }: { sectors: JobsSector[] }) {
  const ordered = [...sectors].sort((a, b) => b.workforceSharePct - a.workforceSharePct);
  const total = ordered.reduce((sum, s) => sum + s.workforceSharePct, 0) || 100;
  const colorFor = (i: number) => BLUE_RAMP[i % BLUE_RAMP.length];

  return (
    <figure className="grid gap-5 rounded-xl border border-[rgb(var(--line))] bg-[rgb(var(--panel)/0.55)] p-5 sm:p-6">
      <div className="relative h-[280px] w-full pl-9 pt-5">
        {/* gridlines */}
        {[0, 25, 50, 75, 100].map((tick) => (
          <div className="absolute left-9 right-0 flex items-center" key={tick} style={{ bottom: `${(tick / 100) * 255 + 4}px` }}>
            <span className="absolute -left-9 w-8 text-right text-[0.62rem] tabular text-[rgb(var(--muted))]">{tick}</span>
            <span className="h-px w-full bg-[rgb(var(--line)/0.6)]" />
          </div>
        ))}

        {/* columns */}
        <div className="absolute inset-x-0 left-9 right-0 bottom-1 flex h-[255px] items-end gap-[2px]">
          {ordered.map((sector, i) => {
            const widthPct = (sector.workforceSharePct / total) * 100;
            return (
              <div
                className="group relative flex h-full flex-col justify-end"
                key={sector.sector}
                style={{ width: `${widthPct}%` }}
                title={`${sector.sector}: ${sector.automationExposurePct}% exposure · ${sector.workforceSharePct}% of workforce`}
              >
                <span className="mb-1 text-center text-[0.6rem] font-semibold tabular leading-none text-[rgb(var(--foreground))]">
                  {sector.automationExposurePct}
                </span>
                <div
                  className="w-full rounded-t-[3px]"
                  style={{ height: `${sector.automationExposurePct}%`, background: colorFor(i) }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
        {ordered.map((sector, i) => (
          <span className="inline-flex items-center gap-2 text-[rgb(var(--muted))]" key={sector.sector}>
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: colorFor(i) }} />
            <span className="text-[rgb(var(--foreground))]">{sector.sector}</span>
            <span className="tabular">
              {sector.workforceSharePct}% · {sector.automationExposurePct}% exp
            </span>
          </span>
        ))}
      </div>

      <figcaption className="text-xs leading-5 text-[rgb(var(--muted))]">
        Column <strong className="text-[rgb(var(--foreground))]">width</strong> = share of the
        workforce; <strong className="text-[rgb(var(--foreground))]">height</strong> (and the number
        above each) = AI automation exposure %.
      </figcaption>
    </figure>
  );
}
