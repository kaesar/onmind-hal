/**
 * Ubuntu distribution strategy implementation
 */

import { BaseDistributionStrategy } from './strategy.js';
import { $ } from 'bun';

export class UbuntuStrategy extends BaseDistributionStrategy {
  name = 'ubuntu';

  /**
   * Detect if the current system is Ubuntu
   */
  async detectDistribution(): Promise<boolean> {
    // Check for Ubuntu-specific files and commands
    const hasLsbRelease = await this.fileExists('/etc/lsb-release');
    const hasOsRelease = await this.fileExists('/etc/os-release');
    const hasApt = await this.commandExists('apt');

    if (!hasApt) {
      return false;
    }

    // Check lsb-release file for Ubuntu identifier
    if (hasLsbRelease) {
      const lsbContent = await this.readFile('/etc/lsb-release');
      if (lsbContent.includes('DISTRIB_ID=Ubuntu')) {
        return true;
      }
    }

    // Check os-release file for Ubuntu identifier
    if (hasOsRelease) {
      const osContent = await this.readFile('/etc/os-release');
      if (osContent.includes('ID=ubuntu') || osContent.includes('NAME="Ubuntu"')) {
        return true;
      }
    }

    // Fallback: check if apt-get exists and system has debian-like structure
    const hasAptGet = await this.commandExists('apt-get');
    const hasDebianVersion = await this.fileExists('/etc/debian_version');
    
    if (hasAptGet && hasDebianVersion) {
      // Additional check to distinguish Ubuntu from pure Debian
      const debianVersion = await this.readFile('/etc/debian_version');
      // Ubuntu typically has version strings like "jammy/sid" or similar
      return debianVersion.includes('/') || debianVersion.includes('ubuntu');
    }

    return false;
  }

  /**
   * Install Docker on Ubuntu using official Docker repository
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

      console.log('📦 Installing Docker on Ubuntu...');
      
      // Update package index
      await $`sudo apt update`.quiet();

      // Install prerequisites
      await $`sudo apt install -y ca-certificates curl gnupg lsb-release`.quiet();

      // Add Docker's official GPG key
      await $`sudo mkdir -p /etc/apt/keyrings`;
      await $`curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg`;

      // Set up the repository
      const arch = await $`dpkg --print-architecture`.text();
      const codename = await $`lsb_release -cs`.text();
      
      await $`echo "deb [arch=${arch.trim()} signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${codename.trim()} stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null`;

      // Update package index with Docker repository
      await $`sudo apt update`.quiet();

      // Install Docker Engine
      await $`sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin`.quiet();

      // Start and enable Docker service
      await $`sudo systemctl start docker`;
      await $`sudo systemctl enable docker`;

      // Add current user to docker group
      const currentUser = await $`whoami`.text();
      await $`sudo usermod -aG docker ${currentUser.trim()}`;

    } catch (error) {
      throw new Error(`Failed to install Docker on Ubuntu: ${error}`);
    }
  }

  /**
   * Install packages using apt package manager
   */
  async installPackages(packages: string[]): Promise<void> {
    if (packages.length === 0) {
      return;
    }

    try {
      // Update package index first
      await $`sudo apt update`.quiet();

      // Install packages
      const packageList = packages.join(' ');
      await $`sudo apt install -y ${packageList}`.quiet();

    } catch (error) {
      throw new Error(`Failed to install packages on Ubuntu: ${error}`);
    }
  }

  /**
   * Configure UFW firewall with required ports for HomeLab services
   */
  async configureFirewall(): Promise<void> {
    try {
      // Install UFW if not already installed
      await $`sudo apt update`.quiet();
      await $`sudo apt install -y ufw`.quiet();

      // Reset UFW to default settings
      await $`sudo ufw --force reset`;

      // Set default policies
      await $`sudo ufw default deny incoming`;
      await $`sudo ufw default allow outgoing`;

      // Allow SSH (port 22) - critical to maintain access
      await $`sudo ufw allow 22/tcp`;

      // Allow HTTP (port 80) for web services
      await $`sudo ufw allow 80/tcp`;

      // Allow HTTPS (port 443) for secure web services
      await $`sudo ufw allow 443/tcp`;

      // Enable UFW
      await $`sudo ufw --force enable`;

      // Show status for verification
      await $`sudo ufw status verbose`;

    } catch (error) {
      throw new Error(`Failed to configure UFW firewall on Ubuntu: ${error}`);
    }
  }

  /**
   * Get the package manager name
   */
  getPackageManager(): string {
    return 'apt';
  }
}