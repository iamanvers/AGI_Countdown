import { describe, expect, it } from "vitest";
import { addMonthsToIso, computeEngineState, type EngineInput } from "./index";

const baseInput: EngineInput = {
  runId: "test-run",
  ts: "2026-06-21T00:00:00.000Z",
  definition: "transformative-ai",
  anchor: {
    date: "2035-01-01T00:00:00.000Z",
    earlyP10: "2032-01-01T00:00:00.000Z",
    lateP90: "2038-01-01T00:00:00.000Z"
  },
  progress: {
    benchmarkSaturation: 0.5,
    computeVsRequired: 0.25,
    economicDeployment: 0.1
  },
  factors: []
};

describe("computeEngineState", () => {
  it("is deterministic for identical inputs", () => {
    const first = computeEngineState(baseInput);
    const second = computeEngineState(structuredClone(baseInput));

    expect(second).toEqual(first);
  });

  it("clamps the total factor delta to configured bounds", () => {
    const state = computeEngineState({
      ...baseInput,
      maxShiftMonths: 6,
      factors: [
        {
          factorId: "frontier-compute",
          normalized: 10,
          sign: 1,
          weight: 3
        }
      ]
    });

    expect(state.deltaMonths).toBe(-6);
    expect(state.tAgi).toBe(addMonthsToIso(baseInput.anchor.date ?? "", -6));
    expect(state.movers).toEqual([
      expect.objectContaining({
        factorId: "frontier-compute",
        contributionMonths: -6
      })
    ]);
  });

  it("uses sign conventions where accelerators move sooner and decelerators move later", () => {
    const state = computeEngineState({
      ...baseInput,
      factors: [
        {
          factorId: "benchmark-jump",
          normalized: 1,
          sign: 1,
          weight: 4
        },
        {
          factorId: "power-bottleneck",
          normalized: 1,
          sign: -1,
          weight: 2
        }
      ]
    });

    expect(state.deltaMonths).toBe(-2);
    expect(state.movers).toEqual([
      expect.objectContaining({
        factorId: "benchmark-jump",
        contributionMonths: -4
      }),
      expect.objectContaining({
        factorId: "power-bottleneck",
        contributionMonths: 2
      })
    ]);
  });

  it("keeps progress in the 0 to 100 range", () => {
    const tooHigh = computeEngineState({
      ...baseInput,
      progress: {
        benchmarkSaturation: 2,
        computeVsRequired: 2,
        economicDeployment: 2
      }
    });
    const tooLow = computeEngineState({
      ...baseInput,
      progress: {
        benchmarkSaturation: -2,
        computeVsRequired: -2,
        economicDeployment: -2
      }
    });

    expect(tooHigh.progress).toBe(100);
    expect(tooLow.progress).toBe(0);
  });

  it("ranks movers by absolute applied contribution, then factor id", () => {
    const state = computeEngineState({
      ...baseInput,
      factors: [
        {
          factorId: "zeta",
          normalized: 1,
          sign: 1,
          weight: 2
        },
        {
          factorId: "alpha",
          normalized: 1,
          sign: -1,
          weight: 2
        },
        {
          factorId: "largest",
          normalized: 1,
          sign: 1,
          weight: 3
        }
      ]
    });

    expect(state.movers.map((mover) => mover.factorId)).toEqual([
      "largest",
      "alpha",
      "zeta"
    ]);
  });
});
