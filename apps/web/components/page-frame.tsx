import type { ReactNode } from "react";

type PageFrameProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
};

export function PageFrame({ children, eyebrow, intro, title }: PageFrameProps) {
  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1500px] gap-8">
        <header className="grid min-h-[34svh] content-end border-b border-[rgb(var(--line)/0.62)] pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--accent-rgb))]">
            {eyebrow}
          </p>
          <h1 className="mt-4 max-w-5xl text-5xl font-semibold leading-none sm:text-7xl lg:text-8xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-[rgb(var(--muted))] sm:text-lg">
            {intro}
          </p>
        </header>
        {children}
      </div>
    </main>
  );
}
