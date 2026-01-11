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
   * Configure dnsmasq for local domain resolution
   * Default implementation for Linux distributions
   */
  async configureDnsmasq(domain: string, ip: string, services: string[]): Promise<void> {
    console.log('🌐 Configuring dnsmasq and certificates for local DNS resolution...');
    
    // Install required packages
    await this.installPackages(['dnsmasq', 'openssl']);
    
    // Generate and install CA certificate (like in the article)
    await this.generateAndInstallCA(domain);
    
    // Create dnsmasq configuration
    const config = [
      '# HomeLab DNS configuration',
      '# Listen on all interfaces',
      `listen-address=${ip}`,
      'listen-address=127.0.0.1',
      '',
      '# Use system DNS as upstream',
      'resolv-file=/etc/resolv.conf.backup',
      '',
      '# Local domain resolution',
      `address=/${domain}/${ip}`,
      `address=/.${domain}/${ip}`,
      '',
      '# Cache settings',
      'cache-size=1000'
    ].join('\n');
    
    // Backup original resolv.conf and create dnsmasq config
    await $`sudo cp /etc/resolv.conf /etc/resolv.conf.backup || true`;
    await $`echo ${config} | sudo tee /etc/dnsmasq.d/homelab.conf`;
    
    // Configure system to use dnsmasq as primary DNS
    const resolvConf = [
      'nameserver 127.0.0.1',
      `nameserver ${ip}`,
      'nameserver 8.8.8.8'
    ].join('\n');
    
    await $`echo ${resolvConf} | sudo tee /etc/resolv.conf`;
    
    // Restart and enable dnsmasq
    await $`sudo systemctl restart dnsmasq`;
    await $`sudo systemctl enable dnsmasq`;
    
    console.log('✅ dnsmasq and CA certificates configured successfully');
  }

  /**
   * Generate and install CA certificate for local domains
   * Based on the HomeLab article approach
   */
  private async generateAndInstallCA(domain: string): Promise<void> {
    const caDir = '/usr/local/share/ca-certificates';
    const caCert = `${caDir}/homelab-ca.crt`;
    const caKey = '/tmp/homelab-ca.key';
    
    // Check if CA already exists
    try {
      await $`test -f ${caCert}`.quiet();
      console.log('📜 CA certificate already exists, skipping generation');
      return;
    } catch {
      // CA doesn't exist, generate it
    }
    
    console.log('📜 Generating CA certificate for local domains...');
    
    // Generate CA private key
    await $`openssl genrsa -out ${caKey} 2048`;
    
    // Generate CA certificate
    const caSubject = `/C=US/ST=Local/L=HomeLab/O=HomeLab/OU=IT/CN=HomeLab CA`;
    await $`openssl req -new -x509 -days 3650 -key ${caKey} -out ${caCert} -subj "${caSubject}"`;
    
    // Install CA certificate in system trust store
    await $`sudo update-ca-certificates`;
    
    // Clean up private key
    await $`rm -f ${caKey}`;
    
    console.log('✅ CA certificate generated and installed in system trust store');
  }

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
      case 'macos':
        return DistributionType.MACOS;
      default:
        throw new DistributionNotSupportedError(strategy.name);
    }
  }
}