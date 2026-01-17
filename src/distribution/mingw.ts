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
    console.log('⚠️  Docker Desktop for Windows should be installed manually');
    console.log('💡 Download from: https://www.docker.com/products/docker-desktop');
    
    // Check if docker is available
    if (await this.commandExists('docker')) {
      console.log('✅ Docker is already available');
    } else {
      throw new Error('Docker not found. Please install Docker Desktop for Windows');
    }
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
