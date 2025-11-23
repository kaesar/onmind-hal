/**
 * Arch Linux distribution strategy implementation
 */

import { BaseDistributionStrategy } from './strategy.js';
import { $ } from 'bun';

export class ArchStrategy extends BaseDistributionStrategy {
  name = 'arch';

  /**
   * Detect if the current system is Arch Linux
   */
  async detectDistribution(): Promise<boolean> {
    // Check for Arch-specific files and commands
    const hasPacman = await this.commandExists('pacman');
    const hasOsRelease = await this.fileExists('/etc/os-release');
    const hasArchRelease = await this.fileExists('/etc/arch-release');

    if (!hasPacman) {
      return false;
    }

    // Check for arch-release file (most definitive)
    if (hasArchRelease) {
      return true;
    }

    // Check os-release file for Arch identifier
    if (hasOsRelease) {
      const osContent = await this.readFile('/etc/os-release');
      if (osContent.includes('ID=arch') || 
          osContent.includes('NAME="Arch Linux"') ||
          osContent.includes('ID_LIKE=arch')) {
        return true;
      }
    }

    // Fallback: check if pacman exists and system has Arch-like structure
    const hasMakepkg = await this.commandExists('makepkg');
    const hasPacmanConf = await this.fileExists('/etc/pacman.conf');
    
    if (hasPacman && hasMakepkg && hasPacmanConf) {
      // Additional check by reading pacman.conf for Arch repositories
      const pacmanConf = await this.readFile('/etc/pacman.conf');
      return pacmanConf.includes('[core]') && pacmanConf.includes('[extra]');
    }

    return false;
  }

  /**
   * Install Docker on Arch Linux using pacman
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

      console.log('📦 Installing Docker on Arch Linux...');
      
      // Update package database
      await $`sudo pacman -Syu --noconfirm`;

      // Install Docker packages
      await $`sudo pacman -S --noconfirm docker docker-buildx`;

      // Start and enable Docker service
      await $`sudo systemctl enable docker`;
      await $`sudo systemctl start docker`;

      // Add current user to docker group
      const currentUser = await $`whoami`.text();
      await $`sudo usermod -aG docker ${currentUser.trim()}`;

      // Ensure Docker daemon is running and accessible
      await $`sudo systemctl restart docker`;
      await $`sleep 3`;

      // Set proper permissions for Docker socket
      await $`sudo chmod 666 /var/run/docker.sock`;

      // Verify Docker installation and permissions
      await $`docker --version`;
      await $`docker info`;
      
      console.log('⚠️  Note: You may need to log out and back in for Docker group changes to take full effect.');
      console.log('    For now, Docker socket permissions have been set to allow immediate access.');

    } catch (error) {
      throw new Error(`Failed to install Docker on Arch Linux: ${error}`);
    }
  }

  /**
   * Install packages using pacman package manager
   */
  async installPackages(packages: string[]): Promise<void> {
    if (packages.length === 0) {
      return;
    }

    try {
      // Update package database first
      await $`sudo pacman -Sy --noconfirm`;

      // Install packages
      const packageList = packages.join(' ');
      await $`sudo pacman -S --noconfirm ${packageList}`;

    } catch (error) {
      throw new Error(`Failed to install packages on Arch Linux: ${error}`);
    }
  }

  /**
   * Configure UFW firewall with required ports for HomeLab services
   */
  async configureFirewall(): Promise<void> {
    try {
      // Update package database and install UFW
      await $`sudo pacman -Sy --noconfirm`;
      await $`sudo pacman -S --noconfirm ufw`;

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

      // Enable UFW service
      await $`sudo systemctl enable ufw`;
      await $`sudo systemctl start ufw`;

      // Enable UFW
      await $`sudo ufw --force enable`;

      // Show status for verification
      await $`sudo ufw status verbose`;

    } catch (error) {
      throw new Error(`Failed to configure UFW firewall on Arch Linux: ${error}`);
    }
  }

  /**
   * Get the package manager name
   */
  getPackageManager(): string {
    return 'pacman';
  }
}