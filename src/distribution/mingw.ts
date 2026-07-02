/**
 * MINGW64 (Git Bash on Windows) distribution strategy
 * Similar to macOS - skips UFW and dnsmasq
 */

import { BaseDistributionStrategy } from './strategy.js';
import { $ } from 'bun';

export class MingwStrategy extends BaseDistributionStrategy {
  name = 'MINGW64';

  async detectDistribution(): Promise<boolean> {
    try {
      const uname = await $`uname -s`.text();
      return uname.trim().startsWith('MINGW');
    } catch {
      return false;
    }
  }

  async installDocker(): Promise<void> {
    // Check if Docker is available
    if (await this.commandExists('docker')) {
      console.log('✅ Docker is already available');
      return;
    }

    // Check if Podman is available as alternative
    if (await this.commandExists('podman')) {
      console.log('✅ Podman is already installed, using it as container runtime...');
      // Verify Podman is working
      try {
        await $`podman info`.quiet();
        console.log('✅ Podman is working correctly');
        return;
      } catch {
        console.log('⚠️  Podman is installed but not working properly...');
      }
    }

    console.log('⚠️  Container runtime not found. Please install one of:');
    console.log('   • Docker Desktop for Windows: https://www.docker.com/products/docker-desktop');
    console.log('   • Podman: https://podman.io/getting-started/installation#installation-on-windows');
    throw new Error('No container runtime found. Please install Docker Desktop or Podman for Windows');
  }

  async installPackages(packages: string[]): Promise<void> {
    console.log(`⚠️  Package installation on Windows should be done manually: ${packages.join(', ')}`);
  }

  async configureFirewall(): Promise<void> {
    console.log('⏭️  Skipping firewall configuration on Windows (not applicable)');
  }

  async configureDnsmasq(domain: string, ip: string, services: string[]): Promise<void> {
    console.log('⏭️  Skipping dnsmasq configuration on Windows (not applicable)');
    console.log('💡 Add entries to C:\\Windows\\System32\\drivers\\etc\\hosts manually if needed');
  }

  getPackageManager(): string {
    return 'none';
  }
}
