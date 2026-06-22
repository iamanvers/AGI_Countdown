"use client";

import { useState } from "react";

export function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = typeof window === "undefined" ? "" : window.location.href;
    const text = "When will AGI arrive? A live, transparent countdown.";
    const nav = typeof navigator !== "undefined" ? navigator : undefined;

    if (nav?.share) {
      try {
        await nav.share({ title: "AGI Countdown", text, url });
        return;
      } catch {
        // user cancelled or share failed — fall through to copy
      }
    }
    try {
      await nav?.clipboard?.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked — nothing more we can do silently
    }
  }

  return (
    <button
      className="focus-ring inline-flex items-center gap-2 rounded-lg border border-[rgb(var(--line))] bg-[rgb(var(--panel)/0.6)] px-3 py-1.5 text-sm font-medium text-[rgb(var(--muted))] transition-colors hover:border-[rgb(var(--accent-rgb)/0.6)] hover:text-[rgb(var(--foreground))]"
      onClick={share}
      type="button"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
