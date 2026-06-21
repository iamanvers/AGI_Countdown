import { PageFrame } from "@/components/page-frame";
import { formatDateOnly, readTimeline } from "@/lib/static-data";

const significanceClass = {
  landmark: "border-[rgb(var(--accent-rgb)/0.8)]",
  major: "border-[rgb(var(--line)/0.8)]",
  minor: "border-[rgb(var(--line)/0.5)]"
};

export default async function NewsPage() {
  const events = (await readTimeline()).sort((left, right) => right.date.localeCompare(left.date));

  return (
    <PageFrame
      eyebrow="Signal Wire"
      intro="A compact stream of model releases, policy moves, infrastructure announcements, and safety events that shape the estimate."
      title="News"
    >
      <section className="grid gap-4">
        {events.map((event) => (
          <article
            className={`grid gap-4 rounded-lg border bg-[rgb(var(--panel)/0.64)] p-5 backdrop-blur md:grid-cols-[180px_minmax(0,1fr)] ${significanceClass[event.significance]}`}
            key={event.id ?? `${event.date}-${event.title}`}
          >
            <div>
              <p className="font-mono text-sm text-[rgb(var(--accent-rgb))]">{formatDateOnly(event.date)}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.15em] text-[rgb(var(--muted))]">
                {event.category}
              </p>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold leading-tight">{event.title}</h2>
                <span className="rounded-full border border-[rgb(var(--line)/0.68)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                  {event.significance}
                </span>
              </div>
              <p className="mt-3 max-w-4xl text-base leading-7 text-[rgb(var(--muted))]">{event.summary}</p>
              <a
                className="focus-ring mt-4 inline-block rounded-sm text-sm text-[rgb(var(--accent-rgb))]"
                href={event.citation}
                rel="noreferrer"
                target="_blank"
              >
                Source
              </a>
            </div>
          </article>
        ))}
      </section>
    </PageFrame>
  );
}
