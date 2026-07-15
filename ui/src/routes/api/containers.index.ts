import { createFileRoute } from "@tanstack/react-router";
import { detectRuntime, resetRuntimeCache, execCommand } from "~/utils/runtime";

interface Container {
  id: string;
  name: string;
  image: string;
  status: string;
  state: "running" | "stopped" | "restarting" | "unknown";
  ports: string;
}

export const Route = createFileRoute("/api/containers/")({
  server: {
    handlers: {
      GET: async () => {
        const runtime = await detectRuntime();
        try {
          const stdout = await execCommand(
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
        } catch (error: any) {
          console.error("[OnMind-HAL] Failed to list containers:", error.message);
          resetRuntimeCache();
          return Response.json(
            { error: "Failed to list containers", containers: [] },
            { status: 500 }
          );
        }
      },
    },
  },
});
