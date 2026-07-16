import { createFileRoute } from "@tanstack/react-router";
import { readFile } from "fs/promises";
import { join } from "path";
import { detectRuntime, resetRuntimeCache, execCommand } from "~/utils/runtime";

export const Route = createFileRoute("/api/services/$id/$action")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { id, action } = params;
        const runtime = await detectRuntime();

        if (!["start", "stop", "restart"].includes(action)) {
          return Response.json({ error: "Invalid action" }, { status: 400 });
        }

        let container: string | undefined;

        // Accept container name from request body (for custom services)
        try {
          const body = await request.json();
          container = body?.container;
        } catch {
          // No body or invalid JSON, fall through to services.json lookup
        }

        // Fall back to services.json lookup
        if (!container) {
          const jsonPath = join(
            process.cwd(),
            "public",
            "data",
            "services.json"
          );
          try {
            const raw = await readFile(jsonPath, "utf-8");
            const services = JSON.parse(raw).services;
            const found = services.find((s: { id: string }) => s.id === id);
            container = found?.container;
          } catch {
            // ignore
          }
        }

        if (!container) {
          return Response.json(
            { error: "Service not found" },
            { status: 404 }
          );
        }

        console.log(`[OnMind-HAL] ${runtime} ${action} ${container}`);
        try {
          await execCommand(`${runtime} ${action} ${container}`);
          return Response.json({
            success: true,
            message: `Container ${action}ed successfully`,
          });
        } catch (err: any) {
          console.error(`[OnMind-HAL] Failed to ${action} ${container}:`, err.message);
          resetRuntimeCache();
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
