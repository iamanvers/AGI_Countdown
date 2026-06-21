"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { ConfidenceBand } from "@/components/confidence-band";
import { CountdownClock } from "@/components/countdown-clock";
import { DefinitionToggle } from "@/components/definition-toggle";
import { LiveSignals } from "@/components/live-signals";
import { MoversList } from "@/components/movers-list";
import { ProgressMeter } from "@/components/progress-meter";
import { RefreshButton } from "@/components/refresh-button";
import {
  type DefinitionId,
  type EngineState,
  dataPathForDefinition,
  defaultDefinition,
  definitions,
  fetchEngineState
} from "@/lib/engine-state";
import { formatDate, formatDateTime, formatMonths } from "@/lib/format";

type LoadState = "loading" | "ready" | "refreshing" | "error";

export function EngineDashboard() {
  const shouldReduceMotion = useReducedMotion();
  const [activeDefinition, setActiveDefinition] = useState<DefinitionId>(defaultDefinition);
  const [snapshots, setSnapshots] = useState<Partial<Record<DefinitionId, EngineState>>>({});
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const state = snapshots[activeDefinition];
  const snapshotsRef = useRef(snapshots);

  useEffect(() => {
    snapshotsRef.current = snapshots;
  }, [snapshots]);

  useEffect(() => {
    const controller = new AbortController();
    const hasSnapshot = Boolean(snapshotsRef.current[activeDefinition]);
    setLoadState(hasSnapshot ? "refreshing" : "loading");
    setError(null);

    fetchEngineState(activeDefinition, controller.signal)
      .then((nextState) => {
        setSnapshots((current) => ({ ...current, [activeDefinition]: nextState }));
        setLoadState("ready");
      })
      .catch((nextError: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setError(nextError instanceof Error ? nextError.message : "Unable to load engine state.");
        setLoadState(hasSnapshot ? "ready" : "error");
      });

    return () => controller.abort();
  }, [activeDefinition]);

  const definitionLabel = useMemo(
    () => definitions.find((definition) => definition.id === activeDefinition)?.label ?? "AGI",
    [activeDefinition]
  );

  return (
    <main
      className="px-4 pb-16 pt-6 sm:px-6 lg:px-8"
      data-definition={activeDefinition}
    >
      <div className="mx-auto w-full max-w-[1500px]">
        <header className="flex flex-col gap-4 border-b border-[rgb(var(--line)/0.5)] pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--muted))]">
              Deterministic forecast clock
            </p>
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">
              A live estimate of when{" "}
              <span className="font-medium text-[rgb(var(--foreground))]">{definitionLabel}</span>{" "}
              arrives — blended from public forecasts, nudged by live signals.
            </p>
          </div>
          <DefinitionToggle
            active={activeDefinition}
            disabled={loadState === "loading" && !state}
            onChange={setActiveDefinition}
          />
        </header>

        <AnimatePresence mode="wait">
          {state ? (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
              key={state.definition}
              transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 22 }}
            >
              <section className="py-2">
                <CountdownClock targetIso={state.tAgi} />
              </section>

              <SnapshotFooter loadState={loadState} state={state} />

              <section className="mt-8 grid gap-4 lg:grid-cols-3">
                <ProgressMeter value={state.progress} />
                <ConfidenceBand state={state} />
                <EstimateSummary state={state} />
              </section>

              <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.5fr)]">
                <MoversList movers={state.movers} />
                <LiveSignals />
              </section>

              <ExploreStrip />
            </motion.div>
          ) : (
            <LoadingPanel
              definition={activeDefinition}
              error={error}
              key="loading"
              loadState={loadState}
              reduceMotion={shouldReduceMotion}
            />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function EstimateSummary({ state }: { state: EngineState }) {
  const direction = state.deltaMonths < 0 ? "sooner" : state.deltaMonths > 0 ? "later" : "unchanged";
  return (
    <section className="grid content-start gap-3 rounded-lg border border-[rgb(var(--line)/0.7)] bg-[rgb(var(--panel)/0.66)] p-5 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
        How the date was built
      </p>
      <Row label="Forecast anchor" value={formatDate(state.anchor)} />
      <Row
        label="Live factor shift"
        value={`${formatMonths(state.deltaMonths)} ${direction}`}
      />
      <Row label="Estimated arrival" value={formatDate(state.tAgi)} emphasize />
    </section>
  );
}

function Row({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-[rgb(var(--line)/0.4)] pt-3 first-of-type:border-t-0 first-of-type:pt-0">
      <span className="text-sm text-[rgb(var(--muted))]">{label}</span>
      <span
        className={`tabular text-right ${emphasize ? "text-lg font-semibold text-[rgb(var(--accent-rgb))]" : "font-medium"}`}
      >
        {value}
      </span>
    </div>
  );
}

function SnapshotFooter({ loadState, state }: { loadState: LoadState; state: EngineState }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[rgb(var(--line)/0.5)] py-4 text-sm text-[rgb(var(--muted))]">
      <div className="flex flex-wrap items-center gap-3">
        <span>
          Snapshot <span className="font-mono text-xs text-[rgb(var(--foreground))]">{state.runId}</span>
        </span>
        {state.stale ? (
          <span className="rounded-full border border-amber-400/35 bg-amber-400/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-200">
            Stale
          </span>
        ) : null}
        {loadState === "refreshing" ? (
          <span className="rounded-full border border-[rgb(var(--line)/0.66)] px-3 py-1 text-xs uppercase tracking-[0.14em]">
            Refreshing
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <RefreshButton />
        <span className="tabular">Computed {formatDateTime(state.ts)}</span>
      </div>
    </div>
  );
}

function ExploreStrip() {
  const cards = [
    { href: "/methodology", title: "Methodology", copy: "The exact formula, factors, and weights." },
    { href: "/jobs", title: "Jobs & automation", copy: "Exposure by sector and the roles emerging." },
    { href: "/timeline", title: "Timeline", copy: "The milestones that got us here." }
  ];
  return (
    <section className="mt-10 grid gap-3 sm:grid-cols-3">
      {cards.map((card) => (
        <Link
          className="focus-ring group rounded-lg border border-[rgb(var(--line)/0.66)] bg-[rgb(var(--panel)/0.55)] p-5 transition-colors hover:border-[rgb(var(--accent-rgb)/0.6)]"
          href={card.href}
          key={card.href}
        >
          <p className="text-base font-semibold">{card.title}</p>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{card.copy}</p>
          <span className="mt-3 inline-block text-sm text-[rgb(var(--accent-rgb))]">Explore →</span>
        </Link>
      ))}
    </section>
  );
}

function LoadingPanel({
  definition,
  error,
  loadState,
  reduceMotion
}: {
  definition: DefinitionId;
  error: string | null;
  loadState: LoadState;
  reduceMotion: boolean | null;
}) {
  const expectedPath = dataPathForDefinition(definition);
  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="grid place-items-center py-24"
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 22 }}
    >
      <div className="w-full max-w-2xl rounded-lg border border-[rgb(var(--line)/0.7)] bg-[rgb(var(--panel)/0.72)] p-6 text-center backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgb(var(--accent-rgb))]">
          {loadState === "error" ? "Snapshot unavailable" : "Loading snapshot"}
        </p>
        <h1 className="mt-4 text-4xl font-semibold sm:text-6xl">AGI Countdown</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[rgb(var(--muted))]">
          {error ?? `Fetching ${expectedPath}`}
        </p>
      </div>
    </motion.section>
  );
}
