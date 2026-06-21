import type { Mover } from "@/lib/engine-state";
import { formatMonths } from "@/lib/format";

type MoversListProps = {
  movers: Mover[];
};

export function MoversList({ movers }: MoversListProps) {
  const visibleMovers = movers.slice(0, 4);

  return (
    <section className="rounded-lg border border-[rgb(var(--line)/0.7)] bg-[rgb(var(--panel)/0.72)] p-5 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
          Top Movers
        </h2>
        <span className="text-xs uppercase tracking-[0.16em] text-[rgb(var(--muted))]">This run</span>
      </div>

      {visibleMovers.length > 0 ? (
        <ul className="mt-4 grid gap-3">
          {visibleMovers.map((mover) => {
            const sooner = mover.contributionMonths < 0;

            return (
              <li
                className="rounded-md border border-[rgb(var(--line)/0.55)] bg-[rgb(var(--background)/0.28)] p-4"
                key={`${mover.factorId}-${mover.citation}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-sm uppercase tracking-[0.12em] text-[rgb(var(--foreground))]">
                      {humanizeFactorId(mover.factorId)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{mover.rationale}</p>
                  </div>
                  <span
                    className={[
                      "shrink-0 rounded-full px-3 py-1 text-xs font-semibold tabular",
                      sooner
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-red-500/15 text-red-300"
                    ].join(" ")}
                  >
                    {formatMonths(mover.contributionMonths)} {sooner ? "sooner" : "later"}
                  </span>
                </div>
                <p className="mt-3 truncate text-xs text-[rgb(var(--muted))]">{mover.citation}</p>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 rounded-md border border-[rgb(var(--line)/0.55)] bg-[rgb(var(--background)/0.28)] p-4 text-sm text-[rgb(var(--muted))]">
          No ranked movers in the current snapshot.
        </p>
      )}
    </section>
  );
}

function humanizeFactorId(factorId: string) {
  return factorId
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
