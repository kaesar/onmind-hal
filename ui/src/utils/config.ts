import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { homedir } from "os";

const DEFAULT_CONFIG_PATH = "ws/init";
const SERVICES_JSON = join(process.cwd(), "public", "data", "services.json");

interface ServicesData {
  configPath?: string;
  services: any[];
}

interface HalState {
  configPath?: string;
}

let cachedConfigPath: string | null = null;

async function readServicesData(): Promise<ServicesData> {
  const raw = await readFile(SERVICES_JSON, "utf-8");
  return JSON.parse(raw);
}

async function writeServicesData(data: ServicesData): Promise<void> {
  await writeFile(SERVICES_JSON, JSON.stringify(data, null, 2) + "\n");
}

async function readHalState(): Promise<HalState | null> {
  try {
    const halPath = join(homedir(), DEFAULT_CONFIG_PATH, "onmind-hal.json");
    const raw = await readFile(halPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Get the configPath from services.json.
 * If not set, reads from onmind-hal.json and syncs it back.
 * Falls back to DEFAULT_CONFIG_PATH.
 */
export async function getConfigPath(): Promise<string> {
  if (cachedConfigPath) return cachedConfigPath;

  const data = await readServicesData();

  if (data.configPath) {
    cachedConfigPath = data.configPath;
    return cachedConfigPath;
  }

  const halState = await readHalState();
  if (halState?.configPath) {
    data.configPath = halState.configPath;
    await writeServicesData(data);
    cachedConfigPath = halState.configPath;
    return cachedConfigPath;
  }

  cachedConfigPath = DEFAULT_CONFIG_PATH;
  return cachedConfigPath;
}

/**
 * Build a full path from configPath + relative segments.
 */
export async function resolveConfigPath(...segments: string[]): Promise<string> {
  const base = await getConfigPath();
  return join(homedir(), base, ...segments);
}
