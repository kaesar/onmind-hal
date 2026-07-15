import { createFileRoute } from "@tanstack/react-router";
import { detectRuntime, execCommand } from "~/utils/runtime";

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
          const logs = await execCommand(
            `${runtime} logs --tail ${lines} ${container} 2>&1`
          );
          return Response.json({ logs, container });
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
