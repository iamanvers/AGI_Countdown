/**
 * Single source of truth for the site's canonical base URL.
 *
 * Set NEXT_PUBLIC_SITE_URL in the environment (e.g. https://agi-countdown.vercel.app).
 * Falls back to localhost for local development so metadata/OG resolution never
 * silently points at the wrong origin.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

export const SITE_NAME = "AGI Countdown";
export const SITE_DESCRIPTION =
  "A deterministic, zero-cost live countdown to AGI — built from public forecasts and live signals, with every assumption cited.";
