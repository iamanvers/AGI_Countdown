"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { formatDateTime } from "@/lib/format";

type CountdownClockProps = {
  targetIso: string;
};

type CountdownParts = {
  totalSeconds: number;
  years: string;
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};

const secondMs = 1000;
const minuteMs = secondMs * 60;
const hourMs = minuteMs * 60;
const dayMs = hourMs * 24;
const yearMs = dayMs * 365;

export function CountdownClock({ targetIso }: CountdownClockProps) {
  const shouldReduceMotion = useReducedMotion();
  const targetMs = useMemo(() => new Date(targetIso).getTime(), [targetIso]);
  const [parts, setParts] = useState(() => getCountdownParts(targetMs));

  useEffect(() => {
    setParts(getCountdownParts(targetMs));

    // A seconds-resolution clock only needs a light timer — far cheaper than a
    // 60fps animation-frame loop. State only changes when the second rolls over,
    // so React bails out of re-rendering between ticks.
    const period = shouldReduceMotion ? secondMs : 250;
    const interval = window.setInterval(() => {
      setParts((current) => {
        const next = getCountdownParts(targetMs);
        return next.totalSeconds === current.totalSeconds ? current : next;
      });
    }, period);

    return () => window.clearInterval(interval);
  }, [shouldReduceMotion, targetMs]);

  return (
    <section aria-labelledby="countdown-heading" className="py-6 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[rgb(var(--accent-rgb))]">
            Estimated arrival
          </p>
          <h1
            id="countdown-heading"
            className="gradient-text mt-3 max-w-4xl text-5xl font-bold leading-[0.95] tracking-tight sm:text-7xl xl:text-8xl"
          >
            AGI Countdown
          </h1>
        </div>
        <p className="text-right text-sm text-[rgb(var(--muted))] tabular">
          {formatDateTime(targetIso)}
        </p>
      </div>

      <div
        aria-label={`${parts.years} years, ${parts.days} days, ${parts.hours} hours, ${parts.minutes} minutes, and ${parts.seconds} seconds remaining`}
        className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5 md:gap-4"
      >
        <TimeBlock label="Years" reduceMotion={shouldReduceMotion} value={parts.years} />
        <TimeBlock label="Days" reduceMotion={shouldReduceMotion} value={parts.days} />
        <TimeBlock label="Hours" reduceMotion={shouldReduceMotion} value={parts.hours} />
        <TimeBlock label="Minutes" reduceMotion={shouldReduceMotion} value={parts.minutes} />
        <TimeBlock label="Seconds" reduceMotion={shouldReduceMotion} value={parts.seconds} wideOnMobile />
      </div>
    </section>
  );
}

function TimeBlock({
  label,
  reduceMotion,
  value,
  wideOnMobile
}: {
  label: string;
  reduceMotion: boolean | null;
  value: string;
  wideOnMobile?: boolean;
}) {
  return (
    <div
      className={[
        "overflow-hidden rounded-xl border border-[rgb(var(--line)/0.55)] bg-[rgb(var(--panel)/0.4)] px-3 py-5 backdrop-blur-sm",
        wideOnMobile ? "col-span-2 sm:col-span-1" : ""
      ].join(" ")}
    >
      <div className="relative h-20 sm:h-28 xl:h-32">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-0 flex items-center justify-center font-mono text-5xl font-semibold leading-none tracking-tight tabular sm:text-7xl xl:text-8xl"
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: "-34%" }}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: "34%" }}
            key={value}
            transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 230, damping: 28 }}
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <p className="mt-1 text-center text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
        {label}
      </p>
    </div>
  );
}

function getCountdownParts(targetMs: number): CountdownParts {
  const remainingMs = Number.isFinite(targetMs) ? Math.max(0, targetMs - Date.now()) : 0;
  const totalSeconds = Math.floor(remainingMs / secondMs);
  const years = Math.floor(remainingMs / yearMs);
  const afterYears = remainingMs - years * yearMs;
  const days = Math.floor(afterYears / dayMs);
  const afterDays = afterYears - days * dayMs;
  const hours = Math.floor(afterDays / hourMs);
  const afterHours = afterDays - hours * hourMs;
  const minutes = Math.floor(afterHours / minuteMs);
  const seconds = Math.floor((afterHours - minutes * minuteMs) / secondMs);

  return {
    totalSeconds,
    years: pad(years, 2),
    days: days.toString(),
    hours: pad(hours, 2),
    minutes: pad(minutes, 2),
    seconds: pad(seconds, 2)
  };
}

function pad(value: number, length: number) {
  return value.toString().padStart(length, "0");
}
