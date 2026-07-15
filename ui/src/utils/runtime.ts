import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

let cachedRuntime: string | null = null;
let hasLoggedDetection = false;

export async function detectRuntime(): Promise<string> {
  if (cachedRuntime) return cachedRuntime;

  if (process.env.CONTAINER_RUNTIME) {
    cachedRuntime = process.env.CONTAINER_RUNTIME;
    if (!hasLoggedDetection) {
      console.log(`[OnMind-HAL] Runtime: ${cachedRuntime} (configured)`);
      hasLoggedDetection = true;
    }
    return cachedRuntime;
  }

  for (const rt of ["podman", "docker"]) {
    try {
      const { stdout } = await execAsync(`${rt} --version`);
      cachedRuntime = rt;
      if (!hasLoggedDetection) {
        console.log(`[OnMind-HAL] Runtime: ${rt} — ${stdout.trim()}`);
        hasLoggedDetection = true;
      }
      return rt;
    } catch (err: any) {
      if (!hasLoggedDetection) {
        console.log(`[OnMind-HAL] ${rt} not found: ${err.message}`);
      }
    }
  }

  cachedRuntime = "podman";
  if (!hasLoggedDetection) {
    console.log("[OnMind-HAL] Runtime: podman (default)");
    hasLoggedDetection = true;
  }
  return cachedRuntime;
}

export function resetRuntimeCache() {
  cachedRuntime = null;
  hasLoggedDetection = false;
}

export async function execCommand(cmd: string): Promise<string> {
  const { stdout } = await execAsync(cmd);
  return stdout;
}

export async function inspectContainer(
  runtime: string,
  container: string
): Promise<string> {
  const { stdout } = await execAsync(
    `${runtime} inspect --format='{{.State.Status}}' ${container}`
  );
  return stdout;
}
