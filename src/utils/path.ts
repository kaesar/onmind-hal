/**
 * Path conversion utilities for MINGW64 (Git Bash on Windows)
 */

import { $ } from 'bun';

export class PathConverter {
  /**
   * Check if running on MINGW64
   */
  static isMingw(): boolean {
    return process.platform === 'win32' || (process.env.MSYSTEM?.startsWith('MINGW') ?? false);
  }

  /**
   * Convert Unix-style path to Windows path for MINGW64
   * Examples:
   *   ~/ws/init -> C:/Users/username/ws/init
   *   ~/ws/data/caddy -> C:/Users/username/ws/data/caddy
   */
  static async convertPath(unixPath: string): Promise<string> {
    if (!this.isMingw()) {
      return unixPath;
    }

    try {
      // Expand ~ to user home directory
      if (unixPath.startsWith('~/')) {
        const homeDir = process.env.USERPROFILE || process.env.HOME;
        if (homeDir) {
          // Replace ~ with home directory and convert to forward slashes
          const windowsPath = unixPath.replace('~', homeDir).replace(/\\/g, '/');
          return windowsPath;
        }
      }

      // If path doesn't start with ~, return as-is with forward slashes
      return unixPath.replace(/\\/g, '/');
    } catch {
      return unixPath;
    }
  }

  /**
   * Convert volume mount paths in docker command for MINGW64
   * Converts: -v ~/ws/init:/etc/caddy
   * To: -v "C:/Users/username/ws/init:/etc/caddy"
   */
  static async convertDockerVolumes(command: string): Promise<string> {
    if (!this.isMingw()) {
      return command;
    }

    // Match -v volume:container patterns
    const volumeRegex = /-v\s+([^\s:]+):([^\s]+)/g;
    let convertedCommand = command;
    const matches = [...command.matchAll(volumeRegex)];

    for (const match of matches) {
      const fullMatch = match[0];
      const hostPath = match[1];
      const containerPath = match[2];

      // Convert host path
      const convertedHostPath = await this.convertPath(hostPath);
      
      // Wrap in quotes if contains spaces or special chars
      const quotedPath = convertedHostPath.includes(' ') || convertedHostPath.includes('\\')
        ? `"${convertedHostPath}:${containerPath}"`
        : `${convertedHostPath}:${containerPath}`;

      // Replace in command
      convertedCommand = convertedCommand.replace(fullMatch, `-v ${quotedPath}`);
    }

    return convertedCommand;
  }
}
