import { createFileRoute } from "@tanstack/react-router";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { homedir } from "os";

const CADDYFILE_PATH = join(homedir(), "ws", "init", "Caddyfile");

export const Route = createFileRoute("/api/caddyfile")({
  component: () => null,
  server: {
    handlers: {
      GET: async () => {
        try {
          const content = await readFile(CADDYFILE_PATH, "utf-8");
          return Response.json({ content, path: CADDYFILE_PATH });
        } catch (err: any) {
          if (err.code === "ENOENT") {
            return Response.json(
              { error: "Caddyfile not found", path: CADDYFILE_PATH },
              { status: 404 }
            );
          }
          return Response.json(
            { error: err.message || "Failed to read Caddyfile" },
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
          await mkdir(dirname(CADDYFILE_PATH), { recursive: true });
          await writeFile(CADDYFILE_PATH, body.content, "utf-8");
          return Response.json({ success: true, path: CADDYFILE_PATH });
        } catch (err: any) {
          return Response.json(
            { error: err.message || "Failed to write Caddyfile" },
            { status: 500 }
          );
        }
      },
    },
  },
});
