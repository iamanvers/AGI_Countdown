import { PageFrame } from "@/components/page-frame";

export const metadata = {
  title: "About — AGI Countdown",
  description: "Why this clock exists and what it's actually telling you."
};

export default function AboutPage() {
  return (
    <PageFrame
      eyebrow="Why this exists"
      intro="“When will AGI arrive?” is one of the most consequential questions of our era — and the answer is usually a shrug, a hot take, or a sales pitch. This is an attempt to replace that fog with one honest, transparent number that updates as the world actually changes."
      title="About"
    >
      <section className="grid max-w-3xl gap-5 text-base leading-7 text-[rgb(var(--muted))]">
        <p>
          Most AGI predictions are a single confident date from a single confident person. They rarely
          say <em>why</em>, rarely show their uncertainty, and never update when the facts move. We
          wanted the opposite: a clock you can interrogate. Open the{" "}
          <a className="text-[rgb(var(--accent-rgb))]" href="/methodology">methodology</a> and you can
          see every input, every weight, and exactly what nudged the date today.
        </p>
        <p>
          <strong className="text-[rgb(var(--foreground))]">What it tells you</strong> is not a
          prophecy. It&apos;s a continuously-recomputed best estimate: it starts from what
          forecasters, prediction markets, expert surveys, and compute-based models collectively
          expect, then moves that date sooner or later as live signals change — frontier benchmark
          results, training compute, capital, energy limits, policy, and public sentiment. When those
          signals move, the clock moves. When the data is thin, the uncertainty band widens. That&apos;s
          the honest version of an answer.
        </p>
        <p>
          It&apos;s deliberately <strong className="text-[rgb(var(--foreground))]">not hype and not
          doom</strong>. The number is computed by a transparent formula, never invented by a model,
          and every figure on the site links back to a primary source. You should be able to disagree
          with it <em>specifically</em> — &ldquo;I&apos;d weight energy more&rdquo; — rather than just
          vibe against it.
        </p>
        <p>
          And it runs on nothing. A scheduled job gathers free public data, recomputes the estimate,
          and publishes static files. No servers humming, no paid feeds, no AI model required to
          produce the number — so the project can keep ticking indefinitely.
        </p>
      </section>

      <section className="grid gap-3">
        <h2 className="text-2xl font-semibold">&ldquo;AGI&rdquo; means three different things</h2>
        <p className="max-w-3xl text-sm leading-7 text-[rgb(var(--muted))]">
          A lot of the disagreement about timelines is really disagreement about definitions. So we
          track three, and you can switch between them on the clock — the date visibly moves.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { name: "Weak AGI", blurb: "Competent, human-level performance across most knowledge-work tasks under supervision." },
            { name: "Transformative AI", blurb: "AI that measurably reshapes labor, research, and economic output across whole sectors." },
            { name: "Strong AGI", blurb: "Robust, general, autonomous capability across cognitive domains and long horizons." }
          ].map((def) => (
            <div className="rounded-lg border border-[rgb(var(--line)/0.66)] bg-[rgb(var(--panel)/0.55)] p-5" key={def.name}>
              <p className="font-semibold">{def.name}</p>
              <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{def.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid max-w-3xl gap-3 rounded-lg border border-[rgb(var(--line)/0.5)] bg-[rgb(var(--panel)/0.5)] p-6">
        <h2 className="text-lg font-semibold">A note on certainty</h2>
        <p className="text-sm leading-7 text-[rgb(var(--muted))]">
          The projected date is an estimate, not a prediction of record. The confidence band is wide
          on purpose — nobody knows this number, and anyone who tells you they do is selling something.
          Treat the clock as a way to think clearly about the trajectory, not as financial, investment,
          or professional advice.
        </p>
      </section>
    </PageFrame>
  );
}
