"use client";

import { useState } from "react";

type Phase = "idle" | "loading" | "queued" | "cooldown" | "not-configured" | "error";

const tone: Record<Phase, string> = {
  idle: "text-[rgb(var(--muted))]",
  loading: "text-[rgb(var(--muted))]",
  queued: "text-[rgb(var(--positive))]",
  cooldown: "text-[rgb(var(--warn))]",
  "not-configured": "text-[rgb(var(--muted))]",
  error: "text-[rgb(var(--later))]"
};

export function RefreshButton() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function trigger() {
    setPhase("loading");
    setMessage(null);
    try {
      const response = await fetch("/api/refresh", { method: "POST" });
      const data = (await response.json()) as { status?: Phase; message?: string };
      setPhase(data.status ?? (response.ok ? "queued" : "error"));
      setMessage(data.message ?? null);
    } catch {
      setPhase("error");
      setMessage("Network error — please try again.");
    }
  }

  const busy = phase === "loading";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        className="focus-ring inline-flex items-center gap-2 rounded-full border border-[rgb(var(--line)/0.7)] bg-[rgb(var(--panel-strong)/0.7)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition-colors hover:border-[rgb(var(--accent-rgb)/0.6)] hover:text-[rgb(var(--accent-rgb))] disabled:opacity-60"
        disabled={busy}
        onClick={trigger}
        type="button"
      >
        <span
          aria-hidden
          className={`h-1.5 w-1.5 rounded-full bg-[rgb(var(--accent-rgb))] ${busy ? "animate-pulse" : ""}`}
        />
        {busy ? "Requesting…" : "Trigger refresh"}
      </button>
      {message ? <span className={`text-xs ${tone[phase]}`}>{message}</span> : null}
    </div>
  );
}
