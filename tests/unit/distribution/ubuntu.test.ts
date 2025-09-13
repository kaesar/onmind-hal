/**
 * Unit tests for Ubuntu distribution strategy
 */

import { describe, it, expect, beforeEach, spyOn } from 'bun:test';
import { UbuntuStrategy } from '../../../src/distribution/ubuntu.js';

describe('UbuntuStrategy', () => {
  let strategy: UbuntuStrategy;

  beforeEach(() => {
    strategy = new UbuntuStrategy();
  });

  describe('name', () => {
    it('should return ubuntu as name', () => {
      expect(strategy.name).toBe('ubuntu');
    });
  });

  describe('getPackageManager', () => {
    it('should return apt as package manager', () => {
      expect(strategy.getPackageManager()).toBe('apt');
    });
  });

  describe('detectDistribution', () => {
    it('should return true when lsb-release contains Ubuntu identifier', async () => {
      const mockFileExists = spyOn(strategy as any, 'fileExists')
        .mockImplementation((path: string) => {
          if (path === '/etc/lsb-release') return Promise.resolve(true);
          return Promise.resolve(false);
        });

      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockResolvedValue(true);

      const mockReadFile = spyOn(strategy as any, 'readFile')
        .mockResolvedValue('DISTRIB_ID=Ubuntu\nDISTRIB_RELEASE=22.04');

      const result = await strategy.detectDistribution();
      expect(result).toBe(true);

      mockFileExists.mockRestore();
      mockCommandExists.mockRestore();
      mockReadFile.mockRestore();
    });

    it('should return true when os-release contains Ubuntu ID', async () => {
      const mockFileExists = spyOn(strategy as any, 'fileExists')
        .mockImplementation((path: string) => {
          if (path === '/etc/lsb-release') return Promise.resolve(false);
          if (path === '/etc/os-release') return Promise.resolve(true);
          return Promise.resolve(false);
        });

      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockResolvedValue(true);

      const mockReadFile = spyOn(strategy as any, 'readFile')
        .mockResolvedValue('ID=ubuntu\nNAME="Ubuntu"\nVERSION="22.04"');

      const result = await strategy.detectDistribution();
      expect(result).toBe(true);

      mockFileExists.mockRestore();
      mockCommandExists.mockRestore();
      mockReadFile.mockRestore();
    });

    it('should return true when os-release contains Ubuntu NAME', async () => {
      const mockFileExists = spyOn(strategy as any, 'fileExists')
        .mockImplementation((path: string) => {
          if (path === '/etc/lsb-release') return Promise.resolve(false);
          if (path === '/etc/os-release') return Promise.resolve(true);
          return Promise.resolve(false);
        });

      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockResolvedValue(true);

      const mockReadFile = spyOn(strategy as any, 'readFile')
        .mockResolvedValue('NAME="Ubuntu"\nVERSION="22.04"');

      const result = await strategy.detectDistribution();
      expect(result).toBe(true);

      mockFileExists.mockRestore();
      mockCommandExists.mockRestore();
      mockReadFile.mockRestore();
    });

    it('should return true for Ubuntu-like debian version', async () => {
      const mockFileExists = spyOn(strategy as any, 'fileExists')
        .mockImplementation((path: string) => {
          if (path === '/etc/lsb-release') return Promise.resolve(false);
          if (path === '/etc/os-release') return Promise.resolve(false);
          if (path === '/etc/debian_version') return Promise.resolve(true);
          return Promise.resolve(false);
        });

      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockImplementation((cmd: string) => {
          if (cmd === 'apt') return Promise.resolve(true);
          if (cmd === 'apt-get') return Promise.resolve(true);
          return Promise.resolve(false);
        });

      const mockReadFile = spyOn(strategy as any, 'readFile')
        .mockResolvedValue('jammy/sid');

      const result = await strategy.detectDistribution();
      expect(result).toBe(true);

      mockFileExists.mockRestore();
      mockCommandExists.mockRestore();
      mockReadFile.mockRestore();
    });

    it('should return false when apt command does not exist', async () => {
      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockResolvedValue(false);

      const result = await strategy.detectDistribution();
      expect(result).toBe(false);

      mockCommandExists.mockRestore();
    });

    it('should return false when no Ubuntu identifiers are found', async () => {
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
  });



  describe('installDocker', () => {
    it.skip('should execute Docker installation commands', async () => {
      const mockShellCommands: string[] = [];
      const originalShell = global.$ as any;
      
      global.$ = ((strings: TemplateStringsArray, ...values: any[]) => {
        const command = strings.reduce((acc, str, i) => {
          return acc + str + (values[i] || '');
        }, '');
        mockShellCommands.push(command);
        
        if (command.includes('whoami')) {
          return { text: () => Promise.resolve('testuser\n') };
        }
        if (command.includes('dpkg --print-architecture')) {
          return { text: () => Promise.resolve('amd64\n') };
        }
        if (command.includes('lsb_release -cs')) {
          return { text: () => Promise.resolve('jammy\n') };
        }
        
        return Promise.resolve();
      }) as any;

      await strategy.installDocker();

      expect(mockShellCommands.some(cmd => cmd.includes('apt update'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('apt install -y ca-certificates'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('docker-ce'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('systemctl start docker'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('systemctl enable docker'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('usermod -aG docker'))).toBe(true);

      global.$ = originalShell;
    });

    it.skip('should throw error when Docker installation fails', async () => {
      const originalShell = global.$ as any;
      global.$ = (() => {
        throw new Error('Installation failed');
      }) as any;

      await expect(strategy.installDocker()).rejects.toThrow('Failed to install Docker on Ubuntu');

      global.$ = originalShell;
    });
  });

  describe('installPackages', () => {
    it.skip('should install packages using apt', async () => {
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

      expect(mockShellCommands.some(cmd => cmd.includes('apt update'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('apt install -y curl wget git'))).toBe(true);

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

      await expect(strategy.installPackages(['nonexistent-package'])).rejects.toThrow('Failed to install packages on Ubuntu');

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
      expect(mockShellCommands.some(cmd => cmd.includes('apt update'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('apt install -y ufw'))).toBe(true);

      // Check that UFW is reset and configured
      expect(mockShellCommands.some(cmd => cmd.includes('ufw --force reset'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('ufw default deny incoming'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('ufw default allow outgoing'))).toBe(true);

      // Check that required ports are allowed
      expect(mockShellCommands.some(cmd => cmd.includes('ufw allow 22/tcp'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('ufw allow 80/tcp'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('ufw allow 443/tcp'))).toBe(true);

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

      await expect(strategy.configureFirewall()).rejects.toThrow('Failed to configure UFW firewall on Ubuntu');

      global.$ = originalShell;
    });
  });
});