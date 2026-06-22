import { clamp } from "@/lib/engine-state";

type ProgressMeterProps = {
  value: number;
  definitionLabel?: string;
};

export function ProgressMeter({ value, definitionLabel = "AGI" }: ProgressMeterProps) {
  const progress = clamp(value, 0, 100);

  return (
    <section className="card p-5 backdrop-blur">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
        Capability index
      </h2>
      <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
        How close today&apos;s frontier AI is to the {definitionLabel} bar — a composite of benchmark
        results, compute vs. what&apos;s needed, and real-world deployment.
      </p>
      <p className="mt-3 text-3xl font-semibold tabular">{progress.toFixed(0)}%</p>
      <div
        aria-label={`Capability index ${progress.toFixed(0)} percent`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={progress}
        className="mt-3 h-3 overflow-hidden rounded-full bg-[rgb(var(--panel-strong))]"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-[rgb(var(--accent-rgb))] transition-[width] duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[0.66rem] uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
        <span>early</span>
        <span>{definitionLabel}-level</span>
      </div>
    </section>
  );
}
