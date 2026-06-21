import Link from "next/link";

const links = [
  { href: "/", label: "Clock" },
  { href: "/sources", label: "Sources" },
  { href: "/news", label: "News" },
  { href: "/articles", label: "Articles" },
  { href: "/research", label: "Research" }
];

export function SiteNav() {
  return (
    <nav className="sticky top-0 z-40 border-b border-[rgb(var(--line)/0.55)] bg-[rgb(var(--background)/0.82)] px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
        <Link className="focus-ring rounded-sm font-mono text-sm font-semibold uppercase tracking-[0.18em]" href="/">
          AGI Countdown
        </Link>
        <div className="flex min-w-0 items-center gap-1 overflow-x-auto rounded-full border border-[rgb(var(--line)/0.56)] bg-[rgb(var(--panel)/0.58)] p-1">
          {links.map((link) => (
            <Link
              className="focus-ring whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))] transition-colors hover:bg-[rgb(var(--panel-strong)/0.7)] hover:text-[rgb(var(--foreground))]"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
