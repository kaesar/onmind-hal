import { createFileRoute } from "@tanstack/react-router";
import { readFile } from "fs/promises";
import { join } from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

let cachedRuntime: string | null = null;

async function detectRuntime(): Promise<string> {
  if (cachedRuntime) return cachedRuntime;
  if (process.env.CONTAINER_RUNTIME) {
    cachedRuntime = process.env.CONTAINER_RUNTIME;
    return cachedRuntime;
  }
  for (const rt of ["podman", "docker"]) {
    try {
      await execAsync(`${rt} --version`);
      cachedRuntime = rt;
      return rt;
    } catch {
      // not available
    }
  }
  cachedRuntime = "podman";
  return cachedRuntime;
}

export const Route = createFileRoute("/api/logs")({
  component: () => null,
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const container = url.searchParams.get("container");
        const lines = url.searchParams.get("lines") || "200";

        if (!container) {
          return Response.json(
            { error: "container query parameter is required" },
            { status: 400 }
          );
        }

        const runtime = await detectRuntime();
        try {
          const { stdout } = await execAsync(
            `${runtime} logs --tail ${lines} ${container} 2>&1`
          );
          return Response.json({ logs: stdout, container });
        } catch (err: any) {
          return Response.json(
            { error: err.message || "Failed to get logs" },
            { status: 500 }
          );
        }
      },
    },
  },
});
