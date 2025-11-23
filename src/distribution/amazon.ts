/**
 * Amazon Linux distribution strategy implementation
 */

import { BaseDistributionStrategy } from './strategy.js';
import { $ } from 'bun';

export class AmazonLinuxStrategy extends BaseDistributionStrategy {
  name = 'amazon';

  /**
   * Detect if the current system is Amazon Linux
   */
  async detectDistribution(): Promise<boolean> {
    // Check for Amazon Linux-specific files and commands
    const hasDnf = await this.commandExists('dnf');
    const hasYum = await this.commandExists('yum');
    const hasOsRelease = await this.fileExists('/etc/os-release');
    const hasSystemRelease = await this.fileExists('/etc/system-release');

    if (!hasDnf && !hasYum) {
      return false;
    }

    // Check system-release file for Amazon Linux identifier (most definitive)
    if (hasSystemRelease) {
      const systemContent = await this.readFile('/etc/system-release');
      if (systemContent.includes('Amazon Linux')) {
        return true;
      }
    }

    // Check os-release file for Amazon Linux identifier
    if (hasOsRelease) {
      const osContent = await this.readFile('/etc/os-release');
      if (osContent.includes('ID="amzn"') || 
          osContent.includes('NAME="Amazon Linux"') ||
          osContent.includes('ID_LIKE="rhel fedora"')) {
        return true;
      }
    }

    // Fallback: check for Amazon Linux specific directories and files
    const hasAmazonDir = await this.fileExists('/etc/amazon-linux-release');
    if (hasAmazonDir) {
      return true;
    }

    // Additional check for EC2 environment (common for Amazon Linux)
    const hasEc2Metadata = await this.fileExists('/sys/hypervisor/uuid');
    if (hasEc2Metadata && (hasDnf || hasYum)) {
      try {
        const uuid = await this.readFile('/sys/hypervisor/uuid');
        // EC2 instances typically start with 'ec2' or have specific patterns
        if (uuid.startsWith('ec2') || uuid.startsWith('EC2')) {
          return true;
        }
      } catch {
        // Continue with other checks if this fails
      }
    }

    return false;
  }

  /**
   * Install Docker on Amazon Linux using dnf/yum
   */
  async installDocker(): Promise<void> {
    try {
      // Check if Docker is already installed
      const dockerInstalled = await this.commandExists('docker');
      if (dockerInstalled) {
        console.log('✅ Docker is already installed, skipping installation...');
        // Ensure Docker service is running
        await $`sudo systemctl enable docker`;
        await $`sudo systemctl start docker`;
        return;
      }

      console.log('📦 Installing Docker on Amazon Linux...');
      
      const packageManager = await this.getPreferredPackageManager();

      // Update package database
      await $`sudo ${packageManager} update -y`.quiet();

      // Install Docker
      await $`sudo ${packageManager} install -y docker`.quiet();

      // Start and enable Docker service
      await $`sudo systemctl enable docker`;
      await $`sudo systemctl start docker`;

      // Add current user to docker group
      const currentUser = await $`whoami`.text();
      await $`sudo usermod -aG docker ${currentUser.trim()}`;

      // Verify Docker installation
      await $`docker --version`;

    } catch (error) {
      throw new Error(`Failed to install Docker on Amazon Linux: ${error}`);
    }
  }

  /**
   * Install packages using dnf/yum package manager
   */
  async installPackages(packages: string[]): Promise<void> {
    if (packages.length === 0) {
      return;
    }

    try {
      const packageManager = await this.getPreferredPackageManager();

      // Update package database first
      await $`sudo ${packageManager} update -y`.quiet();

      // Install packages
      const packageList = packages.join(' ');
      await $`sudo ${packageManager} install -y ${packageList}`.quiet();

    } catch (error) {
      throw new Error(`Failed to install packages on Amazon Linux: ${error}`);
    }
  }

  /**
   * Configure firewall with required ports for HomeLab services
   * Amazon Linux uses firewalld by default
   */
  async configureFirewall(): Promise<void> {
    try {
      const packageManager = await this.getPreferredPackageManager();

      // Install firewalld if not already installed
      await $`sudo ${packageManager} update -y`.quiet();
      await $`sudo ${packageManager} install -y firewalld`.quiet();

      // Start and enable firewalld service
      await $`sudo systemctl enable firewalld`.quiet();
      await $`sudo systemctl start firewalld`.quiet();

      // Configure firewall rules
      // Allow SSH (port 22) - critical to maintain access
      await $`sudo firewall-cmd --permanent --add-service=ssh`.quiet();

      // Allow HTTP (port 80) for web services
      await $`sudo firewall-cmd --permanent --add-service=http`.quiet();

      // Allow HTTPS (port 443) for secure web services
      await $`sudo firewall-cmd --permanent --add-service=https`.quiet();

      // Reload firewall to apply changes
      await $`sudo firewall-cmd --reload`;

      // Show status for verification
      await $`sudo firewall-cmd --list-all`;

    } catch (error) {
      throw new Error(`Failed to configure firewall on Amazon Linux: ${error}`);
    }
  }

  /**
   * Get the package manager name
   */
  getPackageManager(): string {
    return 'dnf';
  }

  /**
   * Get the preferred package manager (dnf over yum if available)
   */
  private async getPreferredPackageManager(): Promise<string> {
    const hasDnf = await this.commandExists('dnf');
    return hasDnf ? 'dnf' : 'yum';
  }
}