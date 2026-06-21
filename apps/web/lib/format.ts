export function formatDateTime(value: string | Date, options?: Intl.DateTimeFormatOptions) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...options
  }).format(date);
}

export function formatDate(value: string | Date) {
  return formatDateTime(value, {
    hour: undefined,
    minute: undefined
  });
}

export function formatMonths(value: number) {
  const absolute = Math.abs(value);
  const months = absolute.toLocaleString("en", {
    maximumFractionDigits: absolute < 10 ? 1 : 0
  });

  return `${months} mo`;
}

export function formatCompactNumber(value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
    ...options
  }).format(value);
}

export function formatRelativeTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const ms = Date.now() - date.getTime();
  if (!Number.isFinite(ms)) return "recently";
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

/** "refresh-hourly-2026...-weak-agi" -> "hourly". */
export function cadenceFromRunId(runId: string) {
  const match = runId.match(/^refresh-(hourly|daily|weekly|monthly|all)\b/);
  return match ? (match[1] === "all" ? "full" : match[1]) : "scheduled";
}
