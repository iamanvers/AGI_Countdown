import { notFound } from "next/navigation";

import { PageFrame } from "@/components/page-frame";
import { articles, findArticle } from "@/lib/articles";

type ArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return articles.map((article) => ({
    slug: article.slug
  }));
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = findArticle(slug);

  return {
    title: article ? `${article.title} | AGI Countdown` : "Article | AGI Countdown",
    description: article?.summary
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = findArticle(slug);

  if (!article) {
    notFound();
  }

  return (
    <PageFrame eyebrow={article.kicker} intro={article.summary} title={article.title}>
      <article className="mx-auto grid max-w-4xl gap-8">
        <p className="font-mono text-sm uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          {article.readingTime}
        </p>
        {article.sections.map((section) => (
          <section className="border-t border-[rgb(var(--line)/0.62)] pt-8" key={section.heading}>
            <h2 className="text-3xl font-semibold leading-tight">{section.heading}</h2>
            <p className="mt-4 text-lg leading-8 text-[rgb(var(--muted))]">{section.body}</p>
          </section>
        ))}
      </article>
    </PageFrame>
  );
}
