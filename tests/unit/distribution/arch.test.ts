/**
 * Unit tests for Arch Linux distribution strategy
 */

import { describe, it, expect, beforeEach, spyOn } from 'bun:test';
import { ArchStrategy } from '../../../src/distribution/arch.js';

describe('ArchStrategy', () => {
  let strategy: ArchStrategy;

  beforeEach(() => {
    strategy = new ArchStrategy();
  });

  describe('name', () => {
    it('should return arch as name', () => {
      expect(strategy.name).toBe('arch');
    });
  });

  describe('getPackageManager', () => {
    it('should return pacman as package manager', () => {
      expect(strategy.getPackageManager()).toBe('pacman');
    });
  });

  describe('detectDistribution', () => {
    it('should return true when arch-release file exists', async () => {
      const mockFileExists = spyOn(strategy as any, 'fileExists')
        .mockImplementation((path: string) => {
          if (path === '/etc/arch-release') return Promise.resolve(true);
          return Promise.resolve(false);
        });
      
      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockResolvedValue(true);

      const result = await strategy.detectDistribution();
      expect(result).toBe(true);

      mockFileExists.mockRestore();
      mockCommandExists.mockRestore();
    });

    it('should return true when os-release contains Arch ID', async () => {
      const mockFileExists = spyOn(strategy as any, 'fileExists')
        .mockImplementation((path: string) => {
          if (path === '/etc/arch-release') return Promise.resolve(false);
          if (path === '/etc/os-release') return Promise.resolve(true);
          return Promise.resolve(false);
        });
      
      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockResolvedValue(true);
      
      const mockReadFile = spyOn(strategy as any, 'readFile')
        .mockResolvedValue('ID=arch\nNAME="Arch Linux"\nPRETTY_NAME="Arch Linux"');

      const result = await strategy.detectDistribution();
      expect(result).toBe(true);

      mockFileExists.mockRestore();
      mockCommandExists.mockRestore();
      mockReadFile.mockRestore();
    });

    it('should return true when os-release contains Arch NAME', async () => {
      const mockFileExists = spyOn(strategy as any, 'fileExists')
        .mockImplementation((path: string) => {
          if (path === '/etc/arch-release') return Promise.resolve(false);
          if (path === '/etc/os-release') return Promise.resolve(true);
          return Promise.resolve(false);
        });
      
      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockResolvedValue(true);
      
      const mockReadFile = spyOn(strategy as any, 'readFile')
        .mockResolvedValue('NAME="Arch Linux"\nPRETTY_NAME="Arch Linux"');

      const result = await strategy.detectDistribution();
      expect(result).toBe(true);

      mockFileExists.mockRestore();
      mockCommandExists.mockRestore();
      mockReadFile.mockRestore();
    });

    it('should return true when os-release contains ID_LIKE=arch', async () => {
      const mockFileExists = spyOn(strategy as any, 'fileExists')
        .mockImplementation((path: string) => {
          if (path === '/etc/arch-release') return Promise.resolve(false);
          if (path === '/etc/os-release') return Promise.resolve(true);
          return Promise.resolve(false);
        });
      
      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockResolvedValue(true);
      
      const mockReadFile = spyOn(strategy as any, 'readFile')
        .mockResolvedValue('ID=manjaro\nID_LIKE=arch\nNAME="Manjaro Linux"');

      const result = await strategy.detectDistribution();
      expect(result).toBe(true);

      mockFileExists.mockRestore();
      mockCommandExists.mockRestore();
      mockReadFile.mockRestore();
    });

    it('should return true when pacman, makepkg exist and pacman.conf has Arch repos', async () => {
      const mockFileExists = spyOn(strategy as any, 'fileExists')
        .mockImplementation((path: string) => {
          if (path === '/etc/arch-release') return Promise.resolve(false);
          if (path === '/etc/os-release') return Promise.resolve(false);
          if (path === '/etc/pacman.conf') return Promise.resolve(true);
          return Promise.resolve(false);
        });
      
      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockImplementation((cmd: string) => {
          if (cmd === 'pacman') return Promise.resolve(true);
          if (cmd === 'makepkg') return Promise.resolve(true);
          return Promise.resolve(false);
        });
      
      const mockReadFile = spyOn(strategy as any, 'readFile')
        .mockResolvedValue('[core]\n[extra]\n[community]');

      const result = await strategy.detectDistribution();
      expect(result).toBe(true);

      mockFileExists.mockRestore();
      mockCommandExists.mockRestore();
      mockReadFile.mockRestore();
    });

    it('should return false when pacman command does not exist', async () => {
      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockResolvedValue(false);

      const result = await strategy.detectDistribution();
      expect(result).toBe(false);

      mockCommandExists.mockRestore();
    });

    it('should return false when no Arch identifiers are found', async () => {
      const mockFileExists = spyOn(strategy as any, 'fileExists')
        .mockResolvedValue(false);
      
      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockResolvedValue(true);
      
      const mockReadFile = spyOn(strategy as any, 'readFile')
        .mockResolvedValue('');

      const result = await strategy.detectDistribution();
      expect(result).toBe(false);

      mockFileExists.mockRestore();
      mockCommandExists.mockRestore();
      mockReadFile.mockRestore();
    });

    it('should return false when pacman.conf does not contain Arch repositories', async () => {
      const mockFileExists = spyOn(strategy as any, 'fileExists')
        .mockImplementation((path: string) => {
          if (path === '/etc/arch-release') return Promise.resolve(false);
          if (path === '/etc/os-release') return Promise.resolve(false);
          if (path === '/etc/pacman.conf') return Promise.resolve(true);
          return Promise.resolve(false);
        });
      
      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockImplementation((cmd: string) => {
          if (cmd === 'pacman') return Promise.resolve(true);
          if (cmd === 'makepkg') return Promise.resolve(true);
          return Promise.resolve(false);
        });
      
      const mockReadFile = spyOn(strategy as any, 'readFile')
        .mockResolvedValue('[custom]\n[other]');

      const result = await strategy.detectDistribution();
      expect(result).toBe(false);

      mockFileExists.mockRestore();
      mockCommandExists.mockRestore();
      mockReadFile.mockRestore();
    });
  });

  describe('installDocker', () => {
    it.skip('should execute Docker installation commands', async () => {
      // Mock all shell commands to avoid actual execution
      const mockShellCommands: string[] = [];
      const originalShell = global.$ as any;
      
      // Create a mock shell function that captures commands
      global.$ = ((strings: TemplateStringsArray, ...values: any[]) => {
        const command = strings.reduce((acc, str, i) => {
          return acc + str + (values[i] || '');
        }, '');
        mockShellCommands.push(command);
        
        // Return mock responses for specific commands
        if (command.includes('whoami')) {
          return { text: () => Promise.resolve('testuser\n') };
        }
        if (command.includes('docker --version')) {
          return Promise.resolve();
        }
        
        return Promise.resolve();
      }) as any;

      await strategy.installDocker();

      // Verify that key Docker installation commands were executed
      expect(mockShellCommands.some(cmd => cmd.includes('pacman -Syu --noconfirm'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('pacman -S --noconfirm docker docker-compose'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('systemctl enable docker'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('systemctl start docker'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('usermod -aG docker'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('docker --version'))).toBe(true);

      // Restore original shell
      global.$ = originalShell;
    });

    it.skip('should throw error when Docker installation fails', async () => {
      // Mock shell to throw error
      const originalShell = global.$ as any;
      global.$ = (() => {
        throw new Error('Installation failed');
      }) as any;

      await expect(strategy.installDocker()).rejects.toThrow('Failed to install Docker on Arch Linux');

      // Restore original shell
      global.$ = originalShell;
    });
  });

  describe('installPackages', () => {
    it.skip('should install packages using pacman', async () => {
      const mockShellCommands: string[] = [];
      const originalShell = global.$ as any;
      
      global.$ = ((strings: TemplateStringsArray, ...values: any[]) => {
        const command = strings.reduce((acc, str, i) => {
          return acc + str + (values[i] || '');
        }, '');
        mockShellCommands.push(command);
        return Promise.resolve();
      }) as any;

      await strategy.installPackages(['curl', 'wget', 'git']);

      expect(mockShellCommands.some(cmd => cmd.includes('pacman -Sy --noconfirm'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('pacman -S --noconfirm curl wget git'))).toBe(true);

      global.$ = originalShell;
    });

    it('should do nothing when no packages are provided', async () => {
      const mockShellCommands: string[] = [];
      const originalShell = global.$ as any;
      
      global.$ = ((strings: TemplateStringsArray, ...values: any[]) => {
        const command = strings.reduce((acc, str, i) => {
          return acc + str + (values[i] || '');
        }, '');
        mockShellCommands.push(command);
        return Promise.resolve();
      }) as any;

      await strategy.installPackages([]);

      expect(mockShellCommands).toHaveLength(0);

      global.$ = originalShell;
    });

    it.skip('should throw error when package installation fails', async () => {
      const originalShell = global.$ as any;
      global.$ = (() => {
        throw new Error('Package installation failed');
      }) as any;

      await expect(strategy.installPackages(['nonexistent-package'])).rejects.toThrow('Failed to install packages on Arch Linux');

      global.$ = originalShell;
    });
  });

  describe('configureFirewall', () => {
    it.skip('should configure UFW firewall with required ports', async () => {
      const mockShellCommands: string[] = [];
      const originalShell = global.$ as any;

      global.$ = ((strings: TemplateStringsArray, ...values: any[]) => {
        const command = strings.reduce((acc, str, i) => {
          return acc + str + (values[i] || '');
        }, '');
        mockShellCommands.push(command);
        return Promise.resolve();
      }) as any;

      await strategy.configureFirewall();

      // Check that UFW is installed
      expect(mockShellCommands.some(cmd => cmd.includes('pacman -Sy --noconfirm'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('pacman -S --noconfirm ufw'))).toBe(true);

      // Check that UFW is reset and configured
      expect(mockShellCommands.some(cmd => cmd.includes('ufw --force reset'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('ufw default deny incoming'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('ufw default allow outgoing'))).toBe(true);

      // Check that required ports are allowed
      expect(mockShellCommands.some(cmd => cmd.includes('ufw allow 22/tcp'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('ufw allow 80/tcp'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('ufw allow 443/tcp'))).toBe(true);

      // Check that UFW service is enabled and started
      expect(mockShellCommands.some(cmd => cmd.includes('systemctl enable ufw'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('systemctl start ufw'))).toBe(true);

      // Check that UFW is enabled
      expect(mockShellCommands.some(cmd => cmd.includes('ufw --force enable'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('ufw status verbose'))).toBe(true);

      global.$ = originalShell;
    });

    it.skip('should throw error when firewall configuration fails', async () => {
      const originalShell = global.$ as any;
      global.$ = (() => {
        throw new Error('UFW installation failed');
      }) as any;

      await expect(strategy.configureFirewall()).rejects.toThrow('Failed to configure UFW firewall on Arch Linux');

      global.$ = originalShell;
    });
  });
});