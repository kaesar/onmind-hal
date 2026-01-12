/**
 * macOS distribution strategy implementation
 */

import { BaseDistributionStrategy } from './strategy.js';
import { ContainerRuntime } from '../core/types.js';
import { Logger } from '../utils/logger.js';
import { ContainerRuntimeUtils } from '../utils/container.js';
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
    try {
      // Use the improved container runtime detection
      const runtime = await ContainerRuntimeUtils.detectRuntime();
      this.detectedRuntime = this.mapToLegacyRuntime(runtime);
      this.logger.info(`✅ Container runtime ${runtime} is ready`);
      return;
    } catch (error) {
      // No working runtime found, provide helpful suggestions
      this.logger.error(`❌ ${error}`);
      this.logger.info('');
      
      const suggestions = ContainerRuntimeUtils.getStartupSuggestions();
      suggestions.forEach(suggestion => this.logger.info(suggestion));
      
      this.logger.info('');
      this.logger.info('📝 macOS-specific installation options:');
      this.logger.info('   • Colima (Recommended): `brew install colima && colima start`');
      this.logger.info('   • Podman: `brew install podman && podman machine init && podman machine start`');
      this.logger.info('   • Docker Desktop: https://www.docker.com/products/docker-desktop');
      
      throw error;
    }
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
   * Map new container runtime types to legacy types for compatibility
   */
  private mapToLegacyRuntime(runtime: 'docker' | 'podman'): ContainerRuntime {
    switch (runtime) {
      case 'docker':
        // Check if it's actually Colima
        try {
          $`colima status`.quiet();
          return ContainerRuntime.COLIMA;
        } catch {
          return ContainerRuntime.DOCKER;
        }
      case 'podman':
        return ContainerRuntime.PODMAN;
      default:
        return ContainerRuntime.DOCKER;
    }
  }

  /**
   * Get the detected container runtime
   */
  getContainerRuntime(): ContainerRuntime | undefined {
    return this.detectedRuntime;
  }
}
