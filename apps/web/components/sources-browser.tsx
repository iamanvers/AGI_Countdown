"use client";

import { useMemo, useState } from "react";

import type { SourceStatus } from "@/lib/static-data";
import { formatDate } from "@/lib/format";

const statusClass: Record<string, string> = {
  ok: "bg-[rgb(var(--positive)/0.16)] text-[rgb(var(--positive))]",
  stale: "bg-[rgb(var(--warn)/0.16)] text-[rgb(var(--warn))]",
  failed: "bg-[rgb(var(--later)/0.18)] text-[rgb(var(--later))]",
  reference: "bg-[rgb(var(--panel-strong)/0.8)] text-[rgb(var(--muted))]"
};

type Kind = "all" | "signal" | "reference";

export function SourcesBrowser({ sources }: { sources: SourceStatus[] }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<Kind>("all");
  const [domain, setDomain] = useState("all");

  const domains = useMemo(
    () => Array.from(new Set(sources.map((s) => s.domain).filter(Boolean) as string[])).sort(),
    [sources]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sources.filter((s) => {
      if (kind === "signal" && s.status === "reference") return false;
      if (kind === "reference" && s.status !== "reference") return false;
      if (domain !== "all" && s.domain !== domain) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.domain ?? "").toLowerCase().includes(q) ||
        s.url.toLowerCase().includes(q)
      );
    });
  }, [sources, query, kind, domain]);

  const inputClass =
    "rounded-lg border border-[rgb(var(--line))] bg-[rgb(var(--panel)/0.6)] px-3 py-2 text-sm text-[rgb(var(--foreground))] focus-ring placeholder:text-[rgb(var(--muted))]";

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          aria-label="Search sources"
          className={`${inputClass} min-w-[220px] flex-1`}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, domain, or URL…"
          type="search"
          value={query}
        />
        <select
          aria-label="Filter by kind"
          className={inputClass}
          onChange={(event) => setKind(event.target.value as Kind)}
          value={kind}
        >
          <option value="all">All kinds</option>
          <option value="signal">Live signals</option>
          <option value="reference">Reference</option>
        </select>
        <select
          aria-label="Filter by domain"
          className={inputClass}
          onChange={(event) => setDomain(event.target.value)}
          value={domain}
        >
          <option value="all">All domains</option>
          {domains.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <span className="text-sm text-[rgb(var(--muted))] tabular">{filtered.length} shown</span>
      </div>

      {filtered.length === 0 ? (
        <p className="card p-6 text-center text-sm text-[rgb(var(--muted))]">No sources match those filters.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((source) => (
            <article className="card p-4" key={source.sourceId}>
              <div className="flex items-start justify-between gap-3">
                <h4 className="font-semibold leading-tight">{source.name}</h4>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[0.66rem] font-semibold uppercase ${statusClass[source.status] ?? ""}`}
                >
                  {source.status}
                </span>
              </div>
              <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                {source.domain ?? "—"}
                {source.tier ? ` · ${source.tier}` : ""} ·{" "}
                {source.status === "reference"
                  ? "reference"
                  : `${source.cadence ?? "—"} · fetched ${formatDate(source.lastFetchedAt)}`}
              </p>
              <a
                className="focus-ring mt-2 block truncate rounded-sm text-sm text-[rgb(var(--accent-rgb))]"
                href={source.url}
                rel="noreferrer"
                target="_blank"
              >
                {source.url}
              </a>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
