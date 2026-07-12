import { createFileRoute } from "@tanstack/react-router";
import { readFile } from "fs/promises";
import { join } from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

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
    const { stdout } = await execAsync(
      `${runtime} inspect --format='{{.State.Status}}' ${container}`
    );
    const status = stdout.trim();
    if (status === "running") return "running";
    if (status === "exited" || status === "created") return "stopped";
    if (status === "restarting") return "restarting";
    return "unknown";
  } catch {
    return "unknown";
  }
}

export const Route = createFileRoute("/api/services/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const runtime = process.env.CONTAINER_RUNTIME || "docker";
        const jsonPath = join(process.cwd(), "public", "data", "services.json");

        let services: Service[];
        try {
          const raw = await readFile(jsonPath, "utf-8");
          services = JSON.parse(raw).services;
        } catch {
          return Response.json(
            { error: "services.json not found" },
            { status: 500 }
          );
        }

        const enriched = await Promise.all(
          services.map(async (s) => ({
            ...s,
            status: await getContainerStatus(s.container, runtime),
          }))
        );

        return Response.json({ services: enriched });
      },
    },
  },
});
