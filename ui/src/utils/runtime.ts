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
      const stdout = await Bun.$`${rt} --version`.text();
      cachedRuntime = rt;
      if (!hasLoggedDetection) {
        console.log(`[OnMind-HAL] Runtime: ${rt} — ${stdout.trim()}`);
        hasLoggedDetection = true;
      }
      return rt;
    } catch {
      // not available
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
