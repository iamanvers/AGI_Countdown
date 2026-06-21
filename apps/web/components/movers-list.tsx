import type { Mover } from "@/lib/engine-state";
import { formatMonths } from "@/lib/format";

type MoversListProps = {
  movers: Mover[];
};

export function MoversList({ movers }: MoversListProps) {
  const items = movers.slice(0, 8);
  const max = Math.max(0.001, ...items.map((m) => Math.abs(m.contributionMonths)));

  return (
    <section className="rounded-lg border border-[rgb(var(--line)/0.7)] bg-[rgb(var(--panel)/0.72)] p-5 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
          What&apos;s moving the clock
        </h2>
        <div className="flex items-center gap-4 text-xs text-[rgb(var(--muted))]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[rgb(var(--accent-rgb))]" /> sooner
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[rgb(var(--later))]" /> later
          </span>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-[rgb(var(--muted))]">
          No factors are moving the estimate this run.
        </p>
      ) : (
        <ul className="mt-4 grid gap-3">
          {items.map((mover) => {
            const sooner = mover.contributionMonths < 0;
            const pct = (Math.abs(mover.contributionMonths) / max) * 50;
            return (
              <li key={`${mover.factorId}-${mover.citation}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <a
                    className="focus-ring rounded-sm text-sm font-medium hover:text-[rgb(var(--accent-rgb))]"
                    href={mover.citation || "#"}
                    rel="noreferrer"
                    target="_blank"
                    title={mover.rationale}
                  >
                    {humanizeFactorId(mover.factorId)}
                  </a>
                  <span
                    className="shrink-0 text-xs font-medium tabular"
                    style={{ color: sooner ? "rgb(var(--accent-rgb))" : "rgb(var(--later))" }}
                  >
                    {formatMonths(mover.contributionMonths)} {sooner ? "sooner" : "later"}
                  </span>
                </div>
                <div className="relative mt-1.5 h-1.5 rounded-full bg-[rgb(var(--panel-strong)/0.8)]">
                  <span className="absolute left-1/2 top-1/2 h-3 w-px -translate-y-1/2 bg-[rgb(var(--line))]" />
                  <span
                    className="absolute top-0 h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      [sooner ? "right" : "left"]: "50%",
                      background: sooner ? "rgb(var(--accent-rgb))" : "rgb(var(--later))"
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-4 text-xs leading-5 text-[rgb(var(--muted))]">
        Each bar is a factor&apos;s contribution to the live shift this run, relative to the largest.
        Click a factor for its source.
      </p>
    </section>
  );
}

function humanizeFactorId(factorId: string) {
  return factorId.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
