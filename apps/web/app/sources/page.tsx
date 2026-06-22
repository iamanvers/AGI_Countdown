import { SourcesBrowser } from "@/components/sources-browser";
import { PageFrame } from "@/components/page-frame";
import { readSources } from "@/lib/static-data";

export const metadata = {
  title: "Sources — AGI Countdown",
  description: "Every source behind the clock, with live health and a tiered reference catalog."
};

export default async function SourcesPage() {
  const sources = await readSources();
  const signal = sources.filter((source) => source.status !== "reference");
  const reference = sources.filter((source) => source.status === "reference");

  return (
    <PageFrame
      eyebrow="Evidence base"
      intro={`${sources.length} sources feed and surround the clock — ${signal.length} live signal feeds with health, plus a ${reference.length}-source reference catalog. Search and filter the full set below; every figure on the site traces back here.`}
      title="Sources"
    >
      <section className="grid gap-3 sm:grid-cols-4">
        <Metric label="Total" value={sources.length} />
        <Metric label="Live signals" value={signal.length} />
        <Metric label="Reference" value={reference.length} />
        <Metric label="Live & healthy" value={signal.filter((s) => s.status === "ok").length} />
      </section>

      <SourcesBrowser sources={sources} />
    </PageFrame>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">{label}</p>
      <p className="mt-3 font-mono text-4xl font-semibold tabular">{value}</p>
    </div>
  );
}
