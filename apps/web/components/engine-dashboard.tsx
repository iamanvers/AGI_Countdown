"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import { ConfidenceBand } from "@/components/confidence-band";
import { CountdownClock } from "@/components/countdown-clock";
import { DefinitionToggle } from "@/components/definition-toggle";
import { MoversList } from "@/components/movers-list";
import { ProgressMeter } from "@/components/progress-meter";
import {
  type DefinitionId,
  type EngineState,
  dataPathForDefinition,
  defaultDefinition,
  definitions,
  fetchEngineState
} from "@/lib/engine-state";
import { formatCompactNumber, formatDateTime } from "@/lib/format";

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
        setSnapshots((current) => ({
          ...current,
          [activeDefinition]: nextState
        }));
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
    <main className="min-h-svh overflow-hidden px-4 py-4 sm:px-6 lg:px-8" data-definition={activeDefinition}>
      <div className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-[1500px] flex-col">
        <header className="flex flex-col gap-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--muted))]">
              Deterministic forecast clock
            </p>
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">
              Active lens: <span className="font-medium text-[rgb(var(--foreground))]">{definitionLabel}</span>
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
              className="grid flex-1 gap-5 pb-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(340px,0.78fr)]"
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
              key={state.definition}
              transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 22 }}
            >
              <div className="flex min-w-0 flex-col justify-center">
                <CountdownClock targetIso={state.tAgi} />
                <SnapshotFooter loadState={loadState} state={state} />
              </div>

              <aside className="grid content-center gap-4">
                <ProgressMeter value={state.progress} />
                <ConfidenceBand state={state} />
                <RatesPanel state={state} />
                <MoversList movers={state.movers} />
              </aside>
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

function SnapshotFooter({ loadState, state }: { loadState: LoadState; state: EngineState }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[rgb(var(--line)/0.66)] py-5 text-sm text-[rgb(var(--muted))]">
      <div className="flex flex-wrap items-center gap-3">
        <span>Snapshot: <span className="font-medium text-[rgb(var(--foreground))]">{state.runId}</span></span>
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
      <span className="tabular">Computed {formatDateTime(state.ts)}</span>
    </div>
  );
}

function RatesPanel({ state }: { state: EngineState }) {
  const rates = state.rates;

  if (!rates || (!rates.computePerSec && !rates.papersPerDay && !rates.investUsdPerSec)) {
    return null;
  }

  const entries = [
    rates.computePerSec
      ? { label: "Compute/sec", value: formatCompactNumber(rates.computePerSec) }
      : null,
    rates.papersPerDay
      ? { label: "Papers/day", value: formatCompactNumber(rates.papersPerDay) }
      : null,
    rates.investUsdPerSec
      ? { label: "Invest/sec", value: `$${formatCompactNumber(rates.investUsdPerSec)}` }
      : null
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <section
      className="grid gap-2 rounded-lg border border-[rgb(var(--line)/0.7)] bg-[rgb(var(--panel)/0.72)] p-3 backdrop-blur"
      style={{ gridTemplateColumns: `repeat(${entries.length}, minmax(0, 1fr))` }}
    >
      {entries.map((entry) => (
        <div className="rounded-md bg-[rgb(var(--background)/0.3)] p-3" key={entry.label}>
          <p className="text-[0.66rem] uppercase tracking-[0.14em] text-[rgb(var(--muted))]">{entry.label}</p>
          <p className="mt-2 font-mono text-lg font-semibold tabular">{entry.value}</p>
        </div>
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
      className="grid flex-1 place-items-center py-20"
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
