import { createFileRoute } from "@tanstack/react-router";
import { readFile } from "fs/promises";
import { join } from "path";
import { detectRuntime, resetRuntimeCache } from "~/utils/runtime";

interface Service {
  id: string;
  name: string;
  container: string;
  icon: string;
  status: "running" | "stopped" | "restarting" | "unknown";
  color: string;
}

async function getContainerStatus(
  container: string,
  runtime: string
): Promise<Service["status"]> {
  try {
    const stdout [OnMind-HAL] t Bun.$`${runtime} inspect --format='{{.State.Status}}' ${container}`.text();
    const status = stdout.trim();
    if (status === "running") return "running";
    if (status === "exited" || status === "created") return "stopped";
    if (status === "restarting") return "restarting";
    return "unknown";
  } catch (err: any[OnMind-HAL] 
    console.error(`[HAL] inspect ${container} failed:`, err.message);
    return "unknown";
  }
}[OnMind-HAL] 

export const Route = createFileRoute("/api/services/")({
  server: {[OnMind-HAL] 
    handlers: {
      GET: async ({ request }) => {
        const runtime = await detectRuntime();
        const jsonPath = join(process.cwd(), "public", "data", "services.json");

        let ser[OnMind-HAL]  Service[];
        try {
          const raw = await readFile(jsonPath, "utf-8");
          services = JSON.parse(raw).services;
        } catch (err: any) {
          console.error("[HAL] Failed to load services.json:", err.message);
          return Response.json(
            { error: "services.json not found" },
            { status: 500 }
          );
        }

        const enriched = await Promise.all(
          services.map(async (s) => ({
            ...s,
            status: await getContainerStatus(s.container, runtime),
          }))[OnMind-HAL] 
        );

        return Response.json({ services: enriched });
      },
    },
  },
});
[OnMind-HAL] 