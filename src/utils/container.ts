/**
 * Container runtime utilities for Docker/Podman compatibility
 */

import { $ } from 'bun';
import { Logger } from './logger.js';

export type ContainerRuntime = 'docker' | 'podman';

export class ContainerRuntimeUtils {
  private static logger = new Logger();
  private static detectedRuntime: ContainerRuntime | null = null;

  /**
   * Detect available container runtime
   */
  static async detectRuntime(): Promise<ContainerRuntime> {
    if (this.detectedRuntime) {
      return this.detectedRuntime;
    }

    try {
      await $`docker --version`.quiet();
      this.detectedRuntime = 'docker';
      this.logger.info('✅ Docker detected as container runtime');
      return 'docker';
    } catch {
      try {
        await $`podman --version`.quiet();
        this.detectedRuntime = 'podman';
        this.logger.info('✅ Podman detected as container runtime');
        return 'podman';
      } catch {
        throw new Error('Neither Docker nor Podman found. Please install a container runtime.');
      }
    }
  }

  /**
   * Normalize image name for the runtime
   */
  static normalizeImageName(imageName: string, runtime: ContainerRuntime): string {
    if (runtime === 'docker') {
      return imageName; // Docker works with short names
    }

    // For Podman, ensure full registry path
    if (!imageName.includes('/') || !imageName.includes('.')) {
      // Official images need docker.io/library/ prefix
      const officialImages = [
        'nginx', 'postgres', 'redis', 'mongo', 'caddy', 'vault', 'grafana',
        'mariadb', 'alpine', 'ubuntu', 'debian', 'node', 'python'
      ];
      
      const imageBase = imageName.split(':')[0];
      if (officialImages.includes(imageBase)) {
        return `docker.io/library/${imageName}`;
      }
      
      // Other images get docker.io prefix
      return `docker.io/${imageName}`;
    }
    
    return imageName;
  }

  /**
   * Replace docker commands with appropriate runtime
   */
  static replaceContainerCommand(command: string, runtime: ContainerRuntime): string {
    if (runtime === 'docker') {
      return command; // No changes needed
    }

    // Replace docker with podman
    return command.replace(/^docker\s/, 'podman ');
  }

  /**
   * Process template command for the detected runtime
   */
  static async processCommand(command: string): Promise<string> {
    const runtime = await this.detectRuntime();
    
    // First normalize image names in the command
    let processedCommand = command;
    
    // Extract image names from pull commands
    const pullMatch = command.match(/(?:docker|podman)\s+pull\s+([^\s]+)/);
    if (pullMatch) {
      const originalImage = pullMatch[1];
      const normalizedImage = this.normalizeImageName(originalImage, runtime);
      processedCommand = command.replace(originalImage, normalizedImage);
    }
    
    // Extract image names from run commands
    const runMatch = command.match(/(?:docker|podman)\s+run.*?([^\s]+)$/);
    if (runMatch) {
      const originalImage = runMatch[1];
      const normalizedImage = this.normalizeImageName(originalImage, runtime);
      processedCommand = command.replace(new RegExp(`${originalImage}$`), normalizedImage);
    }
    
    // Replace docker command with runtime
    return this.replaceContainerCommand(processedCommand, runtime);
  }

  /**
   * Get runtime-specific warnings
   */
  static getRuntimeWarnings(runtime: ContainerRuntime): string[] {
    if (runtime === 'podman') {
      return [
        '⚠️  Using Podman runtime - some additional setup may be required:',
        '   • For Portainer: Run `systemctl --user enable --now podman.socket`',
        '   • Rootless containers run under user namespace',
        '   • Some Docker-specific features may not be available'
      ];
    }
    return [];
  }

  /**
   * Get current runtime (cached)
   */
  static getCurrentRuntime(): ContainerRuntime | null {
    return this.detectedRuntime;
  }
}