/**
 * Base distribution strategy implementation and detection logic
 */

import { DistributionStrategy, DistributionType } from '../core/types.js';
import { DistributionNotSupportedError } from '../utils/errors.js';
import { $ } from 'bun';

/**
 * Abstract base class for distribution strategies
 */
export abstract class BaseDistributionStrategy implements DistributionStrategy {
  abstract name: string;
  abstract detectDistribution(): Promise<boolean>;
  abstract installDocker(): Promise<void>;
  abstract installPackages(packages: string[]): Promise<void>;
  abstract configureFirewall(): Promise<void>;
  abstract getPackageManager(): string;

  /**
   * Check if a command exists in the system
   */
  protected async commandExists(command: string): Promise<boolean> {
    try {
      await $`which ${command}`.quiet();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if a file exists
   */
  protected async fileExists(path: string): Promise<boolean> {
    try {
      await $`test -f ${path}`.quiet();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read file content safely
   */
  protected async readFile(path: string): Promise<string> {
    try {
      const result = await $`cat ${path}`.text();
      return result;
    } catch {
      return '';
    }
  }
}

/**
 * Distribution detection utility class
 */
export class DistributionDetector {
  private strategies: BaseDistributionStrategy[] = [];

  /**
   * Register a distribution strategy
   */
  registerStrategy(strategy: BaseDistributionStrategy): void {
    this.strategies.push(strategy);
  }

  /**
   * Detect the current Linux distribution
   */
  async detectDistribution(): Promise<DistributionStrategy> {
    for (const strategy of this.strategies) {
      if (await strategy.detectDistribution()) {
        return strategy;
      }
    }

    // Try to get distribution info for error message
    let detectedName = 'unknown';
    try {
      const osRelease = await $`cat /etc/os-release`.text();
      const nameMatch = osRelease.match(/^NAME="?([^"]+)"?/m);
      if (nameMatch) {
        detectedName = nameMatch[1];
      }
    } catch {
      // Fallback to uname if os-release is not available
      try {
        detectedName = await $`uname -s`.text().then(s => s.trim());
      } catch {
        // Keep 'unknown' as fallback
      }
    }

    throw new DistributionNotSupportedError(detectedName);
  }

  /**
   * Get distribution type from strategy
   */
  getDistributionType(strategy: DistributionStrategy): DistributionType {
    switch (strategy.name.toLowerCase()) {
      case 'ubuntu':
        return DistributionType.UBUNTU;
      case 'arch':
        return DistributionType.ARCH;
      case 'amazon':
      case 'amazon linux':
        return DistributionType.AMAZON_LINUX;
      default:
        throw new DistributionNotSupportedError(strategy.name);
    }
  }
}