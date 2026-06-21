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
