import { PageFrame } from "@/components/page-frame";
import { formatDateOnly, readTimeline } from "@/lib/static-data";

export const metadata = {
  title: "Timeline — AGI Countdown",
  description: "The milestones shaping progress toward AGI."
};

const significanceClass: Record<string, string> = {
  landmark: "bg-[rgb(var(--accent-rgb)/0.18)] text-[rgb(var(--accent-rgb))]",
  major: "bg-emerald-500/15 text-emerald-300",
  minor: "bg-[rgb(var(--panel-strong)/0.8)] text-[rgb(var(--muted))]"
};

export default async function TimelinePage() {
  const events = (await readTimeline()).sort((left, right) => right.date.localeCompare(left.date));

  return (
    <PageFrame
      eyebrow="Major events"
      intro="The research breakthroughs, model releases, and shifts that move the estimate. Newest first; every entry links to a primary source."
      title="Timeline"
    >
      <ol className="relative grid gap-4 border-l border-[rgb(var(--line)/0.6)] pl-6">
        {events.map((event) => (
          <li className="relative" key={event.id ?? `${event.date}-${event.title}`}>
            <span className="absolute -left-[1.6rem] top-2 h-2.5 w-2.5 rounded-full bg-[rgb(var(--accent-rgb))] ring-4 ring-[rgb(var(--background))]" />
            <article className="rounded-lg border border-[rgb(var(--line)/0.66)] bg-[rgb(var(--panel)/0.62)] p-5 backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <time className="font-mono text-sm text-[rgb(var(--muted))] tabular">
                  {formatDateOnly(event.date)}
                </time>
                <span
                  className={`rounded-full px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.14em] ${significanceClass[event.significance] ?? significanceClass.minor}`}
                >
                  {event.significance} · {event.category}
                </span>
              </div>
              <h2 className="mt-3 text-xl font-semibold leading-tight">{event.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{event.summary}</p>
              <a
                className="focus-ring mt-3 inline-block truncate rounded-sm text-sm text-[rgb(var(--accent-rgb))]"
                href={event.citation}
                rel="noreferrer"
                target="_blank"
              >
                Source ↗
              </a>
            </article>
          </li>
        ))}
      </ol>
    </PageFrame>
  );
}
