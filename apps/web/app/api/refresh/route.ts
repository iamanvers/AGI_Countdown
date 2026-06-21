import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Best-effort in-process cooldown to avoid hammering the workflow dispatch.
let lastTriggerMs = 0;
const COOLDOWN_MS = 60_000;

type RefreshStatus = "queued" | "cooldown" | "not-configured" | "error";

function reply(status: RefreshStatus, message: string, httpStatus: number, detail?: string) {
  return NextResponse.json(
    { ok: status === "queued", status, message, ...(detail ? { detail } : {}) },
    { status: httpStatus }
  );
}

/**
 * Triggers an on-demand pipeline run by dispatching the GitHub Actions workflow.
 * The token lives only in server env; the static site stays secret-free.
 * If unconfigured, responds gracefully so the button can explain itself.
 */
export async function POST() {
  const token = process.env.GITHUB_DISPATCH_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY; // "owner/repo"
  const workflow = process.env.GITHUB_REFRESH_WORKFLOW ?? "refresh-manual.yml";
  const ref = process.env.GITHUB_REF_NAME ?? "master";

  if (!token || !repo || !repo.includes("/")) {
    return reply(
      "not-configured",
      "On-demand refresh isn't wired up here. Set GITHUB_DISPATCH_TOKEN and GITHUB_REPOSITORY to enable it. Scheduled refreshes still run automatically.",
      503
    );
  }

  const now = Date.now();
  if (now - lastTriggerMs < COOLDOWN_MS) {
    const wait = Math.ceil((COOLDOWN_MS - (now - lastTriggerMs)) / 1000);
    return reply("cooldown", `A refresh was just requested. Try again in ${wait}s.`, 429);
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${repo}/actions/workflows/${encodeURIComponent(workflow)}/dispatches`,
      {
        method: "POST",
        headers: {
          accept: "application/vnd.github+json",
          authorization: `Bearer ${token}`,
          "x-github-api-version": "2022-11-28",
          "content-type": "application/json",
          "user-agent": "agi-countdown-web"
        },
        body: JSON.stringify({ ref })
      }
    );

    if (response.status === 204) {
      lastTriggerMs = now;
      return reply(
        "queued",
        "Refresh queued. New numbers appear once the run finishes (about a minute).",
        202
      );
    }

    const detail = (await response.text()).slice(0, 300);
    return reply("error", `GitHub did not accept the dispatch (HTTP ${response.status}).`, 502, detail);
  } catch (error) {
    return reply("error", "Could not reach GitHub to queue the refresh.", 502, String(error).slice(0, 200));
  }
}
