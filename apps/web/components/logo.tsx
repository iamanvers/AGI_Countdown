type LogoProps = {
  className?: string;
  withWordmark?: boolean;
};

/**
 * Mark: an orbit with a trajectory rising to the "arrival" node + pulse —
 * the moment approaching. Gradient runs sky -> indigo -> violet (the mode family).
 */
export function Logo({ className, withWordmark = true }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <svg viewBox="0 0 28 28" width="22" height="22" fill="none" aria-hidden role="img">
        <defs>
          <linearGradient id="agi-mark" x1="2" y1="26" x2="26" y2="2" gradientUnits="userSpaceOnUse">
            <stop stopColor="rgb(56 189 248)" />
            <stop offset="0.55" stopColor="rgb(99 102 241)" />
            <stop offset="1" stopColor="rgb(139 92 246)" />
          </linearGradient>
        </defs>
        <circle cx="14" cy="14" r="12" stroke="url(#agi-mark)" strokeWidth="1.3" opacity="0.32" />
        <path d="M5 19h13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
        <path
          d="M5 19c6 0 9-2.4 13-11"
          stroke="url(#agi-mark)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="20.5" cy="7" r="4.6" stroke="url(#agi-mark)" strokeWidth="1" opacity="0.4" />
        <circle cx="20.5" cy="7" r="2.4" fill="url(#agi-mark)" />
      </svg>
      {withWordmark ? (
        <span className="font-semibold tracking-tight">
          AGI<span className="text-[rgb(var(--muted))]"> Countdown</span>
        </span>
      ) : null}
    </span>
  );
}
