import Link from "next/link";

import { Logo } from "@/components/logo";

const groups: Array<{ heading: string; links: Array<{ href: string; label: string; external?: boolean }> }> = [
  {
    heading: "The clock",
    links: [
      { href: "/", label: "Countdown" },
      { href: "/methodology", label: "Methodology" },
      { href: "/sources", label: "Sources" }
    ]
  },
  {
    heading: "Explore",
    links: [
      { href: "/timeline", label: "Timeline" },
      { href: "/jobs", label: "Jobs & automation" },
      { href: "/developers", label: "Developers / API" },
      { href: "/about", label: "About" }
    ]
  },
  {
    heading: "Project",
    links: [
      { href: "https://github.com/iamanvers/AGI_Countdown", label: "GitHub", external: true }
    ]
  }
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[rgb(var(--line)/0.6)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1500px] gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="grid content-start gap-3">
          <Logo />
          <p className="max-w-xs text-sm leading-6 text-[rgb(var(--muted))]">
            A deterministic, transparent estimate of when AGI arrives — built from public forecasts and
            live signals, every number cited.
          </p>
        </div>
        {groups.map((group) => (
          <div className="grid content-start gap-2" key={group.heading}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
              {group.heading}
            </p>
            {group.links.map((link) =>
              link.external ? (
                <a
                  className="focus-ring rounded-sm text-sm text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--foreground))]"
                  href={link.href}
                  key={link.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  {link.label} ↗
                </a>
              ) : (
                <Link
                  className="focus-ring rounded-sm text-sm text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--foreground))]"
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                </Link>
              )
            )}
          </div>
        ))}
      </div>
      <div className="mx-auto mt-8 flex max-w-[1500px] flex-wrap items-center justify-between gap-3 border-t border-[rgb(var(--line)/0.5)] pt-6 text-xs text-[rgb(var(--muted))]">
        <span>An estimate, not a prediction of record. Not financial advice.</span>
        <span>Data refreshes automatically · {new Date().getUTCFullYear()}</span>
      </div>
    </footer>
  );
}
