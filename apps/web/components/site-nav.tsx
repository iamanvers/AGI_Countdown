"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/logo";

const links = [
  { href: "/", label: "Clock" },
  { href: "/timeline", label: "Timeline" },
  { href: "/jobs", label: "Jobs" },
  { href: "/methodology", label: "Methodology" },
  { href: "/sources", label: "Sources" },
  { href: "/about", label: "About" }
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 border-b border-[rgb(var(--line)/0.55)] bg-[rgb(var(--background)/0.82)] px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
        <Link className="focus-ring rounded-sm text-sm" href="/">
          <Logo />
        </Link>
        <div className="flex min-w-0 items-center gap-1 overflow-x-auto rounded-full border border-[rgb(var(--line)/0.56)] bg-[rgb(var(--panel)/0.58)] p-1">
          {links.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={[
                  "focus-ring whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition-colors",
                  active
                    ? "bg-[rgb(var(--accent-rgb)/0.16)] text-[rgb(var(--foreground))]"
                    : "text-[rgb(var(--muted))] hover:bg-[rgb(var(--panel-strong)/0.7)] hover:text-[rgb(var(--foreground))]"
                ].join(" ")}
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
