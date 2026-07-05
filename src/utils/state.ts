import { readFile, writeFile, access } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { ServiceType, HomelabConfig } from '../core/types.js';

export interface HalState {
  version: number;
  installedAt: string;
  ip: string;
  domain: string;
  networkName: string;
  configPath: string;
  dataPath: string;
  storagePassword?: string;
  managementUI: ServiceType;
  selectedServices: ServiceType[];
}

const STATE_FILENAME = 'onmind-hal.json';
const STATE_VERSION = 1;

function getDefaultStatePath(): string {
  return join(homedir(), 'ws', 'init', STATE_FILENAME);
}

function getStatePath(configPath?: string): string {
  if (configPath) {
    return join(homedir(), configPath, STATE_FILENAME);
  }
  return getDefaultStatePath();
}

export class StateManager {
  static async exists(configPath?: string): Promise<boolean> {
    try {
      await access(getStatePath(configPath));
      return true;
    } catch {
      return false;
    }
  }

  static async load(configPath?: string): Promise<HalState | null> {
    try {
      const data = await readFile(getStatePath(configPath), 'utf-8');
      return JSON.parse(data) as HalState;
    } catch {
      return null;
    }
  }

  static async save(config: HomelabConfig, managementUI: ServiceType): Promise<void> {
    const coreServices = [ServiceType.CADDY, ServiceType.COPYPARTY];
    const missing = coreServices.filter(s => !config.selectedServices.includes(s));

    const state: HalState = {
      version: STATE_VERSION,
      installedAt: new Date().toISOString(),
      ip: config.ip,
      domain: config.domain,
      networkName: config.networkName,
      configPath: config.configPath || 'ws/init',
      dataPath: config.dataPath || 'ws/data',
      storagePassword: config.storagePassword,
      managementUI,
      selectedServices: missing.length > 0
        ? [...config.selectedServices, ...missing]
        : config.selectedServices,
    };

    const filePath = getStatePath(config.configPath);
    await writeFile(filePath, JSON.stringify(state, null, 2));
  }

  static toConfig(state: HalState): Partial<HomelabConfig> & { managementUI?: ServiceType } {
    return {
      ip: state.ip,
      domain: state.domain,
      networkName: state.networkName,
      configPath: state.configPath,
      dataPath: state.dataPath,
      storagePassword: state.storagePassword,
      selectedServices: state.selectedServices,
      managementUI: state.managementUI,
    };
  }
}
