import { PageFrame } from "@/components/page-frame";
import { formatDateOnly, readNews, readTimeline } from "@/lib/static-data";

export const metadata = {
  title: "Timeline — AGI Countdown",
  description: "Live AI developments and the major milestones shaping progress toward AGI."
};

const significanceClass: Record<string, string> = {
  landmark: "bg-[rgb(var(--accent-rgb)/0.18)] text-[rgb(var(--accent-rgb))]",
  major: "bg-emerald-500/15 text-emerald-300",
  minor: "bg-[rgb(var(--panel-strong)/0.8)] text-[rgb(var(--muted))]"
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function TimelinePage() {
  const [events, news] = await Promise.all([readTimeline(), readNews()]);
  const milestones = [...events].sort((a, b) => b.date.localeCompare(a.date));
  const latest = [...news]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 24);

  return (
    <PageFrame
      eyebrow="What's happening"
      intro="Live AI developments pulled fresh each run and tagged by the labs involved, above the major milestones that move the estimate. Everything links to a primary source."
      title="Timeline"
    >
      <section className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold">Latest developments</h2>
          <span className="inline-flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            live · GDELT
          </span>
        </div>

        {latest.length === 0 ? (
          <p className="rounded-lg border border-[rgb(var(--line)/0.6)] bg-[rgb(var(--panel)/0.5)] p-5 text-sm text-[rgb(var(--muted))]">
            The live feed populates on the next scheduled refresh.
          </p>
        ) : (
          <div className="grid max-h-[30rem] gap-2 overflow-y-auto rounded-lg border border-[rgb(var(--line)/0.4)] bg-[rgb(var(--background)/0.2)] p-2 md:grid-cols-2">
            {latest.map((item) => (
              <a
                className="focus-ring group grid gap-2 rounded-lg border border-[rgb(var(--line)/0.6)] bg-[rgb(var(--panel)/0.5)] p-4 transition-colors hover:border-[rgb(var(--accent-rgb)/0.5)]"
                href={item.url}
                key={item.url}
                rel="noreferrer"
                target="_blank"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {item.orgs.map((org) => (
                    <span
                      className="rounded-full bg-[rgb(var(--accent-rgb)/0.16)] px-2 py-0.5 text-[0.66rem] font-semibold uppercase tracking-[0.08em] text-[rgb(var(--accent-rgb))]"
                      key={org}
                    >
                      {org}
                    </span>
                  ))}
                  <span className="ml-auto text-xs text-[rgb(var(--muted))]">
                    {relativeTime(item.publishedAt)}
                  </span>
                </div>
                <p className="text-sm font-medium leading-snug group-hover:text-[rgb(var(--accent-rgb))]">
                  {item.title}
                </p>
                <p className="text-xs text-[rgb(var(--muted))]">{item.source}</p>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4">
        <h2 className="text-2xl font-semibold">Major milestones</h2>
        <ol className="relative grid gap-4 border-l border-[rgb(var(--line)/0.6)] pl-6">
          {milestones.map((event) => (
            <li className="relative" key={event.id ?? `${event.date}-${event.title}`}>
              <span className="absolute -left-[1.6rem] top-2 h-2.5 w-2.5 rounded-full bg-[rgb(var(--accent-rgb))] ring-4 ring-[rgb(var(--background))]" />
              <article className="rounded-lg border border-[rgb(var(--line)/0.66)] bg-[rgb(var(--panel)/0.62)] p-5 backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <time className="font-mono text-sm text-[rgb(var(--muted))] tabular">
                    {formatDateOnly(event.date)}
                  </time>
                  <div className="flex items-center gap-2">
                    {event.curatedBy === "feed" ? (
                      <span className="rounded-full bg-[rgb(var(--panel-strong)/0.8)] px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                        auto
                      </span>
                    ) : null}
                    <span
                      className={`rounded-full px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.14em] ${significanceClass[event.significance] ?? significanceClass.minor}`}
                    >
                      {event.significance} · {event.category}
                    </span>
                  </div>
                </div>
                <h3 className="mt-3 text-xl font-semibold leading-tight">{event.title}</h3>
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
      </section>
    </PageFrame>
  );
}
