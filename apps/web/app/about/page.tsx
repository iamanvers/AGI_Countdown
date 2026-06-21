import { PageFrame } from "@/components/page-frame";

export const metadata = {
  title: "About — AGI Countdown",
  description: "What the AGI Countdown is, and what it is not."
};

export default function AboutPage() {
  return (
    <PageFrame
      eyebrow="What this is"
      intro="A live, transparent estimate of when artificial general intelligence arrives — a Worldometer-style clock built from public forecasts and live signals, with every assumption visible."
      title="About"
    >
      <section className="grid max-w-3xl gap-5 text-base leading-7 text-[rgb(var(--muted))]">
        <p>
          AGI has no agreed arrival rate, so the headline number is an{" "}
          <strong className="text-[rgb(var(--foreground))]">estimate that is continuously recomputed</strong>{" "}
          from the live state of the field. The date is produced by a deterministic engine: public
          forecasts set a baseline, and a bounded model of live signals nudges it sooner or later.
          You can read the exact formula on the{" "}
          <a className="text-[rgb(var(--accent-rgb))]" href="/methodology">methodology</a> page.
        </p>
        <p>
          It runs at <strong className="text-[rgb(var(--foreground))]">zero cost</strong>: a scheduled
          job fetches free public data, computes the snapshot, and commits static JSON the site reads
          from the edge. No always-on servers, no paid APIs, and{" "}
          <strong className="text-[rgb(var(--foreground))]">no AI model is required</strong> to produce
          the number.
        </p>
      </section>

      <section className="grid gap-3 rounded-lg border border-amber-400/25 bg-amber-400/[0.06] p-6">
        <h2 className="text-lg font-semibold text-amber-200">Disclaimer</h2>
        <p className="max-w-3xl text-sm leading-7 text-[rgb(var(--muted))]">
          This is an exploratory model, not a prediction of record. The projected date is uncertain
          and the confidence band is wide for a reason. Nothing here is financial, investment, or
          professional advice. Definitions of &ldquo;AGI&rdquo; are contested — switch the lens on the
          clock to see how much the target definition changes the answer.
        </p>
      </section>

      <section className="grid gap-3">
        <h2 className="text-2xl font-semibold">Three definitions, three clocks</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { name: "Weak AGI", blurb: "Competent human-level performance across most knowledge-work tasks under supervision." },
            { name: "Transformative AI", blurb: "AI that measurably reshapes labor, research, and economic output across sectors." },
            { name: "Strong AGI", blurb: "Robust, general, autonomous capability across cognitive domains and long horizons." }
          ].map((def) => (
            <div className="rounded-lg border border-[rgb(var(--line)/0.66)] bg-[rgb(var(--panel)/0.55)] p-5" key={def.name}>
              <p className="font-semibold">{def.name}</p>
              <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{def.blurb}</p>
            </div>
          ))}
        </div>
      </section>
    </PageFrame>
  );
}
