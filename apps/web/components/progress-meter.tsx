import { clamp } from "@/lib/engine-state";

type ProgressMeterProps = {
  value: number;
};

export function ProgressMeter({ value }: ProgressMeterProps) {
  const progress = clamp(value, 0, 100);

  return (
    <section className="rounded-lg border border-[rgb(var(--line)/0.7)] bg-[rgb(var(--panel)/0.72)] p-5 backdrop-blur">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
            Capability index
          </h2>
          <p className="mt-2 text-3xl font-semibold tabular">{progress.toFixed(1)}%</p>
        </div>
        <div className="max-w-[9rem] text-right text-[0.68rem] leading-4 uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
          composite of benchmarks · compute · deployment
        </div>
      </div>
      <div
        aria-label={`Progress ${progress.toFixed(1)} percent`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={progress}
        className="mt-5 h-3 overflow-hidden rounded-full bg-[rgb(var(--panel-strong))]"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-[rgb(var(--accent-rgb))] shadow-glow transition-[width] duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-3 flex justify-between text-[0.68rem] uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
        <span>0</span>
        <span>100</span>
      </div>
    </section>
  );
}
