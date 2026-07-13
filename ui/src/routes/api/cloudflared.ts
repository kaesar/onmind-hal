import { createFileRoute } from "@tanstack/react-router";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { homedir } from "os";

const CONFIG_PATH = join(homedir(), "ws", "init", "cloudflared", "config.yml");

export const Route = createFileRoute("/api/cloudflared")({
  component: () => null,
  server: {
    handlers: {
      GET: async () => {
        try {
          const content = await readFile(CONFIG_PATH, "utf-8");
          return Response.json({ content, path: CONFIG_PATH });
        } catch (err: any) {
          if (err.code === "ENOENT") {
            return Response.json(
              { error: "config.yml not found", path: CONFIG_PATH },
              { status: 404 }
            );
          }
          return Response.json(
            { error: err.message || "Failed to read config.yml" },
            { status: 500 }
          );
        }
      },
      PUT: async ({ request }) => {
        try {
          const body = await request.json();
          if (typeof body.content !== "string") {
            return Response.json(
              { error: "content field is required" },
              { status: 400 }
            );
          }
          await mkdir(dirname(CONFIG_PATH), { recursive: true });
          await writeFile(CONFIG_PATH, body.content, "utf-8");
          return Response.json({ success: true, path: CONFIG_PATH });
        } catch (err: any) {
          return Response.json(
            { error: err.message || "Failed to write config.yml" },
            { status: 500 }
          );
        }
      },
    },
  },
});
