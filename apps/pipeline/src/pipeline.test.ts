import { describe, expect, it } from "vitest";

import { factorRegistry } from "@agi-countdown/config";
import type { FactorSample, NewsItem } from "@agi-countdown/sources";

import {
  aggregateByFactor,
  applyResponseCurve,
  computeNormalizationSignal,
  createMoverRationale,
  factorIntensity,
  isReleaseMilestone,
} from "./pipeline.js";

const FORECAST = "forecast-consensus-anchor";
const accelerator = factorRegistry.find((f) => f.sign === 1 && f.id !== FORECAST)!;
const decelerator = factorRegistry.find((f) => f.sign === -1)!;

function sample(partial: Partial<FactorSample> & { factorId: string }): FactorSample {
  return {
    sourceId: "src",
    observedAt: "2026-06-01T00:00:00.000Z",
    collectedAt: "2026-06-01T00:00:00.000Z",
    raw: 0.5,
    unit: "index-0-1",
    normalized: 0.5,
    confidence: 0.8,
    citation: "https://epoch.ai/data",
    quarantined: false,
    ...partial,
  };
}

function news(title: string, orgs: string[] = []): NewsItem {
  return {
    title,
    url: "https://www.anthropic.com/news",
    source: "anthropic.com",
    publishedAt: "2026-06-01T00:00:00.000Z",
    orgs,
  };
}

describe("factorIntensity", () => {
  it("is identity within 0..1 bounds and clamps outside", () => {
    expect(factorIntensity(accelerator, 0.7)).toBeCloseTo(0.7, 6);
    expect(factorIntensity(accelerator, 1.4)).toBe(1);
    expect(factorIntensity(accelerator, -0.3)).toBe(0);
  });
});

describe("computeNormalizationSignal (rolling z-score / percentile)", () => {
  it("falls back to the level for a constant series", () => {
    const stat = computeNormalizationSignal("f", [0.5, 0.5, 0.5, 0.5, 0.5], "zscore", 0.5);
    expect(stat.applied).toBe(false);
    expect(stat.signal).toBe(0.5);
  });

  it("falls back when the window is too short", () => {
    const stat = computeNormalizationSignal("f", [0.2, 0.9], "zscore", 0.9);
    expect(stat.applied).toBe(false);
    expect(stat.signal).toBe(0.9);
  });

  it("z-scores a rising series above 0.5 and a falling series below", () => {
    const rising = computeNormalizationSignal("f", [0.4, 0.45, 0.5, 0.55, 0.72], "zscore", 0.72);
    expect(rising.applied).toBe(true);
    expect(rising.signal).toBeGreaterThan(0.5);

    const falling = computeNormalizationSignal("f", [0.6, 0.55, 0.5, 0.45, 0.3], "zscore", 0.3);
    expect(falling.applied).toBe(true);
    expect(falling.signal).toBeLessThan(0.5);
  });

  it("uses an empirical percentile for momentum signals", () => {
    const stat = computeNormalizationSignal("f", [0.4, 0.45, 0.5, 0.55, 0.72], "momentum-01", 0.72);
    expect(stat.applied).toBe(true);
    expect(stat.percentile).toBe(1);
    expect(stat.signal).toBe(1);
  });
});

describe("isReleaseMilestone (strict)", () => {
  it("accepts lab model releases", () => {
    expect(isReleaseMilestone(news("Anthropic releases Claude Opus 4.8", ["Anthropic"]))).toBe(true);
    expect(isReleaseMilestone(news("OpenAI launches GPT-5.5", ["OpenAI"]))).toBe(true);
  });

  it("accepts major policy from a government body", () => {
    expect(isReleaseMilestone(news("EU AI Act enters into force"))).toBe(true);
  });

  it("rejects opinion and commentary", () => {
    expect(isReleaseMilestone(news("Why the AI bubble might finally pop"))).toBe(false);
    expect(isReleaseMilestone(news("My thoughts on AGI timelines"))).toBe(false);
  });
});

describe("aggregateByFactor", () => {
  it("confidence-weights the normalized reading and drops quarantined samples", () => {
    const agg = aggregateByFactor([
      sample({ factorId: "x", normalized: 0.4, confidence: 1 }),
      sample({ factorId: "x", normalized: 0.8, confidence: 1 }),
      sample({ factorId: "x", normalized: 0.0, confidence: 1, quarantined: true }),
    ]);
    expect(agg.get("x")?.normalized).toBeCloseTo(0.6, 6);
  });
});

describe("applyResponseCurve (precautionary decelerators)", () => {
  it("leaves accelerators linear", () => {
    expect(applyResponseCurve(accelerator, 0.36)).toBeCloseTo(0.36, 6);
  });

  it("amplifies decelerators (concave) but never exceeds 1 or flips sign", () => {
    const amplified = applyResponseCurve(decelerator, 0.36);
    expect(amplified).toBeCloseTo(0.6, 6); // sqrt(0.36)
    expect(amplified).toBeGreaterThan(0.36); // a weak headwind is amplified
    expect(applyResponseCurve(decelerator, 1)).toBe(1);
    expect(applyResponseCurve(decelerator, 0)).toBe(0);
  });

  it("amplifies early (low) readings proportionally more than strong ones", () => {
    const lowBoost = applyResponseCurve(decelerator, 0.09) / 0.09; // 0.3/0.09 = 3.33x
    const highBoost = applyResponseCurve(decelerator, 0.81) / 0.81; // 0.9/0.81 = 1.11x
    expect(lowBoost).toBeGreaterThan(highBoost);
  });
});

describe("createMoverRationale (directional)", () => {
  it("describes an accelerator as a tailwind pulling sooner", () => {
    expect(createMoverRationale(accelerator, 0.7)).toContain("tailwind pulling the date sooner");
  });

  it("describes a decelerator as a headwind pushing later (never sooner)", () => {
    const text = createMoverRationale(decelerator, 0.4);
    expect(text).toContain("headwind pushing the date later");
    expect(text).not.toContain("sooner");
  });
});
