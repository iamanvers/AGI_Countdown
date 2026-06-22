import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "AGI Countdown — a live, transparent estimate of when AGI arrives";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function readEstimate(definition: string): Promise<string> {
  try {
    const text = await readFile(
      join(process.cwd(), "public", "data", `engine_state.${definition}.json`),
      "utf8"
    );
    const state = JSON.parse(text) as { tAgi?: string };
    const date = new Date(state.tAgi ?? "");
    if (Number.isNaN(date.getTime())) return "—";
    return `Q${Math.floor(date.getUTCMonth() / 3) + 1} ${date.getUTCFullYear()}`;
  } catch {
    return "—";
  }
}

export default async function OpengraphImage() {
  const [weak, transformative, strong] = await Promise.all([
    readEstimate("weak-agi"),
    readEstimate("transformative-ai"),
    readEstimate("strong-agi")
  ]);

  const rows: Array<[string, string, string]> = [
    ["Weak AGI", weak, "#60a5fa"],
    ["Transformative AI", transformative, "#6366f1"],
    ["Strong AGI", strong, "#8b5cf6"]
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#08090e",
          backgroundImage:
            "radial-gradient(60% 50% at 18% 0%, rgba(99,102,241,0.30), transparent), radial-gradient(50% 50% at 100% 100%, rgba(139,92,246,0.22), transparent)",
          padding: "72px",
          color: "#f4f4f7",
          fontFamily: "sans-serif"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 26, letterSpacing: 6, color: "#9496a5", textTransform: "uppercase" }}>
            Deterministic forecast clock
          </div>
          <div style={{ fontSize: 110, fontWeight: 800, marginTop: 14, letterSpacing: -2 }}>AGI Countdown</div>
          <div style={{ fontSize: 34, color: "#c7c8d2", marginTop: 18, maxWidth: 900 }}>
            When will AGI arrive? One honest, transparent number — built from public forecasts and live signals.
          </div>
        </div>

        <div style={{ display: "flex", gap: 24 }}>
          {rows.map(([label, value, color]) => (
            <div
              key={label}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                border: "1px solid #2e3140",
                borderRadius: 18,
                background: "rgba(19,21,30,0.7)",
                padding: "26px 28px"
              }}
            >
              <div style={{ fontSize: 22, color: "#9496a5" }}>{label}</div>
              <div style={{ fontSize: 56, fontWeight: 700, color, marginTop: 8 }}>{`~ ${value}`}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
