import { $ } from 'bun';

/**
 * Platform and architecture detection utilities
 */
export class PlatformUtils {
  /**
   * Get system architecture
   */
  static async getArchitecture(): Promise<string> {
    try {
      const result = await $`uname -m`.quiet();
      return result.stdout.toString().trim();
    } catch {
      return 'unknown';
    }
  }

  /**
   * Check if current architecture is ARM64
   */
  static async isARM64(): Promise<boolean> {
    const arch = await this.getArchitecture();
    return arch === 'arm64' || arch === 'aarch64';
  }
}