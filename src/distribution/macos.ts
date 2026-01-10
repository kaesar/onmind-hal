/**
 * macOS distribution strategy implementation
 */

import { BaseDistributionStrategy } from './strategy.js';
import { ContainerRuntime } from '../core/types.js';
import { Logger } from '../utils/logger.js';
import { $ } from 'bun';

export class MacOSStrategy extends BaseDistributionStrategy {
  name = 'macOS';
  private logger: Logger;
  private detectedRuntime?: ContainerRuntime;

  constructor() {
    super();
    this.logger = new Logger();
  }

  async detectDistribution(): Promise<boolean> {
    try {
      const uname = await $`uname -s`.text();
      return uname.trim() === 'Darwin';
    } catch {
      return false;
    }
  }

  async installDocker(): Promise<void> {
    // Detect which container runtime is available
    this.detectedRuntime = await this.detectContainerRuntime();

    if (this.detectedRuntime) {
      this.logger.info(`✅ Detected container runtime: ${this.detectedRuntime}`);
      
      // Verify runtime is running
      await this.verifyRuntimeRunning(this.detectedRuntime);
      return;
    }

    // No runtime detected, provide installation instructions
    this.logger.warn('⚠️  No container runtime detected on macOS');
    this.logger.info('\n📦 Please install one of the following:');
    this.logger.info('   1. Colima (Recommended): brew install colima && colima start');
    this.logger.info('   2. Podman: brew install podman && podman machine init && podman machine start');
    this.logger.info('   3. Docker Desktop: https://www.docker.com/products/docker-desktop\n');
    
    throw new Error('No container runtime available. Please install Colima, Podman, or Docker Desktop.');
  }

  async installPackages(packages: string[]): Promise<void> {
    // On macOS, we use Homebrew for package installation
    if (!await this.commandExists('brew')) {
      this.logger.warn('⚠️  Homebrew not detected. Some packages may not be available.');
      return;
    }

    for (const pkg of packages) {
      try {
        this.logger.info(`📦 Installing ${pkg}...`);
        await $`brew install ${pkg}`;
      } catch (error) {
        this.logger.warn(`⚠️  Failed to install ${pkg}: ${error}`);
      }
    }
  }

  async configureFirewall(): Promise<void> {
    // Skip firewall configuration on macOS
    this.logger.info('⏭️  Skipping firewall configuration on macOS (not required for local development)');
  }

  getPackageManager(): string {
    return 'brew';
  }

  /**
   * Detect which container runtime is available
   */
  private async detectContainerRuntime(): Promise<ContainerRuntime | undefined> {
    // Check Colima first (recommended)
    if (await this.commandExists('colima')) {
      return ContainerRuntime.COLIMA;
    }

    // Check Podman
    if (await this.commandExists('podman')) {
      return ContainerRuntime.PODMAN;
    }

    // Check Docker (could be Docker Desktop or Colima's docker)
    if (await this.commandExists('docker')) {
      // Try to determine if it's Colima or Docker Desktop
      try {
        const contextOutput = await $`docker context ls`.text();
        if (contextOutput.includes('colima')) {
          return ContainerRuntime.COLIMA;
        }
      } catch {
        // Ignore error
      }
      return ContainerRuntime.DOCKER;
    }

    return undefined;
  }

  /**
   * Verify that the detected runtime is actually running
   */
  private async verifyRuntimeRunning(runtime: ContainerRuntime): Promise<void> {
    try {
      switch (runtime) {
        case ContainerRuntime.COLIMA:
          await $`colima status`.quiet();
          break;
        case ContainerRuntime.PODMAN:
          await $`podman machine list`.quiet();
          break;
        case ContainerRuntime.DOCKER:
          await $`docker ps`.quiet();
          break;
      }
    } catch (error) {
      throw new Error(`${runtime} is installed but not running. Please start it first.`);
    }
  }

  /**
   * Get the detected container runtime
   */
  getContainerRuntime(): ContainerRuntime | undefined {
    return this.detectedRuntime;
  }
}
