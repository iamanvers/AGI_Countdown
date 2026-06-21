import { PageFrame } from "@/components/page-frame";
import { articles } from "@/lib/articles";

export default function ArticlesPage() {
  return (
    <PageFrame
      eyebrow="Field Notes"
      intro="Short essays around the assumptions behind the clock: definitions, architecture, methodology, and the pressure points that move the estimate."
      title="Articles"
    >
      <section className="grid gap-4 md:grid-cols-2">
        {articles.map((article) => (
          <article
            className="rounded-lg border border-[rgb(var(--line)/0.68)] bg-[rgb(var(--panel)/0.66)] p-6 backdrop-blur"
            key={article.title}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--accent-rgb))]">
              {article.kicker}
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight">{article.title}</h2>
            <p className="mt-4 text-base leading-7 text-[rgb(var(--muted))]">{article.summary}</p>
            <div className="mt-6 flex items-center justify-between gap-4 text-sm">
              <span className="font-mono text-[rgb(var(--muted))]">{article.readingTime}</span>
              <a className="focus-ring rounded-sm text-[rgb(var(--accent-rgb))]" href={`/articles/${article.slug}`}>
                Read
              </a>
            </div>
          </article>
        ))}
      </section>
    </PageFrame>
  );
}
