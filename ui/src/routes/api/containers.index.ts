import { createFileRoute } from "@tanstack/react-router";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface Container {
  id: string;
  name: string;
  image: string;
  status: string;
  state: "running" | "stopped" | "restarting" | "unknown";
  ports: string;
}

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

export const Route = createFileRoute("/api/containers/")({
  server: {
    handlers: {
      GET: async () => {
        const runtime = await detectRuntime();
        try {
          const { stdout } = await execAsync(
            `${runtime} ps -a --no-trunc --format '{{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.State}}\t{{.Ports}}'`
          );
          const containers: Container[] = stdout
            .trim()
            .split("\n")
            .filter(Boolean)
            .map((line) => {
              const [id, name, image, status, state, ports] = line.split("\t");
              let mappedState: Container["state"] = "unknown";
              if (state === "running") mappedState = "running";
              else if (state === "exited" || state === "created") mappedState = "stopped";
              else if (state === "restarting") mappedState = "restarting";
              return {
                id: id?.slice(0, 12) || "",
                name: name || "",
                image: image || "",
                status: status || "",
                state: mappedState,
                ports: ports || "",
              };
            });
          return Response.json({ containers });
        } catch (error) {
          return Response.json(
            { error: "Failed to list containers", containers: [] },
            { status: 500 }
          );
        }
      },
    },
  },
});
