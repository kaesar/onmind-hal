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

export const Route = createFileRoute("/api/services/$id/$action")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { id, action } = params;
        const runtime = await detectRuntime();

        if (!["start", "stop", "restart"].includes(action)) {
          return Response.json({ error: "Invalid action" }, { status: 400 });
        }

        const jsonPath = join(
          process.cwd(),
          "public",
          "data",
          "services.json"
        );
        let container: string | undefined;
        try {
          const raw = await readFile(jsonPath, "utf-8");
          const services = JSON.parse(raw).services;
          const found = services.find((s: { id: string }) => s.id === id);
          container = found?.container;
        } catch {
          // ignore
        }

        if (!container) {
          return Response.json(
            { error: "Service not found" },
            { status: 404 }
          );
        }

        const cmd = `${runtime} ${action} ${container}`;
        try {
          await execAsync(cmd);
          return Response.json({
            success: true,
            message: `Container ${action}ed successfully`,
          });
        } catch (err: any) {
          return Response.json(
            {
              success: false,
              message: err.message || "Command failed",
            },
            { status: 500 }
          );
        }
      },
    },
  },
});
