/**
 * Container runtime utilities for Docker/Podman compatibility
 */

import { $ } from 'bun';
import { Logger } from './logger.js';
import { PathConverter } from './path.js';

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

    // Try Docker first
    try {
      await $`docker --version`.quiet();
      // Verify Docker is actually working
      try {
        await $`docker info`.quiet();
        this.detectedRuntime = 'docker';
        this.logger.info('✅ Docker detected as container runtime');
        return 'docker';
      } catch {
        this.logger.warn('⚠️  Docker is installed but not running');
      }
    } catch {
      // Docker not available
    }

    // Try Podman as fallback
    try {
      await $`podman --version`.quiet();
      // Verify Podman is working
      try {
        await $`podman info`.quiet();
        this.detectedRuntime = 'podman';
        this.logger.info('✅ Podman detected as container runtime');
        return 'podman';
      } catch {
        this.logger.warn('⚠️  Podman is installed but not running properly');
      }
    } catch {
      // Podman not available
    }

    throw new Error('No working container runtime found. Please install and start Docker or Podman.');
  }

  /**
   * Normalize image name for the runtime
   */
  static normalizeImageName(imageName: string, runtime: ContainerRuntime): string {
    if (runtime === 'docker') {
      return imageName; // Docker works with short names
    }

    // For Podman, ensure full registry path
    // Check if image already has a registry (contains a dot before the first slash)
    const firstSlashIndex = imageName.indexOf('/');
    const firstDotIndex = imageName.indexOf('.');
    
    // If there's a dot before the first slash, it likely has a registry
    if (firstDotIndex !== -1 && (firstSlashIndex === -1 || firstDotIndex < firstSlashIndex)) {
      return imageName; // Already has registry
    }
    
    // Official images (no slash) need docker.io/library/ prefix
    if (firstSlashIndex === -1) {
      return `docker.io/library/${imageName}`;
    }
    
    // Images with slash but no registry (like portainer/portainer-ce) get docker.io prefix
    return `docker.io/${imageName}`;
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
    
    // Replace docker commands with runtime, but preserve socket paths
    let processedCommand = command;
    
    // Replace 'docker ' (with space) to avoid changing paths like /var/run/docker.sock
    processedCommand = processedCommand.replace(/\bdocker\s/g, `${runtime} `);
    
    // Convert volume paths for MINGW64
    processedCommand = await PathConverter.convertDockerVolumes(processedCommand);
    
    // Then normalize image names in the command
    // Extract image names from pull commands
    const pullMatch = processedCommand.match(/(?:docker|podman)\s+pull\s+([^\s]+)/);
    if (pullMatch) {
      const originalImage = pullMatch[1];
      const normalizedImage = this.normalizeImageName(originalImage, runtime);
      processedCommand = processedCommand.replace(originalImage, normalizedImage);
    }
    
    // Extract image names from run commands (last argument)
    const runMatch = processedCommand.match(/(?:docker|podman)\s+run.*?([^\s]+)$/);
    if (runMatch) {
      const originalImage = runMatch[1];
      const normalizedImage = this.normalizeImageName(originalImage, runtime);
      processedCommand = processedCommand.replace(new RegExp(`${originalImage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), normalizedImage);
    }
    
    return processedCommand;
  }

  /**
   * Get runtime-specific warnings
   */
  static getRuntimeWarnings(runtime: ContainerRuntime): string[] {
    if (runtime === 'podman') {
      return [
        '⚠️  Using Podman runtime - some additional setup may be required:',
        '   • For macOS: Ensure Podman machine is running with `podman machine start`',
        '   • For Portainer: Run `systemctl --user enable --now podman.socket` (Linux)',
        '   • Rootless containers run under user namespace',
        '   • Some Docker-specific features may not be available',
        '   • Network creation might require manual setup'
      ];
    }
    return [];
  }

  /**
   * Get suggestions for starting container runtime
   */
  static getStartupSuggestions(): string[] {
    return [
      '💡 Container runtime startup suggestions:',
      '   • For Docker: `sudo systemctl start docker` (Linux) or start Docker Desktop',
      '   • For Colima: `colima start`',
      '   • For Podman: `systemctl --user start podman` or `podman machine start`',
      '   • Alternatively, install a different container runtime'
    ];
  }

  /**
   * Get current runtime (cached)
   */
  static getCurrentRuntime(): ContainerRuntime | null {
    return this.detectedRuntime;
  }
}