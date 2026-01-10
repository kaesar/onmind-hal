/**
 * Unit tests for Amazon Linux distribution strategy
 */

import { describe, it, expect, beforeEach, spyOn } from 'bun:test';
import { AmazonLinuxStrategy } from '../../../src/distribution/amazon.js';

describe('AmazonLinuxStrategy', () => {
  let strategy: AmazonLinuxStrategy;

  beforeEach(() => {
    strategy = new AmazonLinuxStrategy();
  });

  describe('name', () => {
    it('should return amazon as name', () => {
      expect(strategy.name).toBe('amazon');
    });
  });

  describe('getPackageManager', () => {
    it('should return dnf as package manager', () => {
      expect(strategy.getPackageManager()).toBe('dnf');
    });
  });

  describe('detectDistribution', () => {
    it('should return true when system-release contains Amazon Linux identifier', async () => {
      const mockFileExists = spyOn(strategy as any, 'fileExists')
        .mockImplementation((path: string) => {
          if (path === '/etc/system-release') return Promise.resolve(true);
          return Promise.resolve(false);
        });
      
      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockImplementation((cmd: string) => {
          if (cmd === 'dnf') return Promise.resolve(true);
          return Promise.resolve(false);
        });
      
      const mockReadFile = spyOn(strategy as any, 'readFile')
        .mockResolvedValue('Amazon Linux release 2023.2.20231113 (Amazon Linux)');

      const result = await strategy.detectDistribution();
      expect(result).toBe(true);

      mockFileExists.mockRestore();
      mockCommandExists.mockRestore();
      mockReadFile.mockRestore();
    });

    it('should return true when os-release contains Amazon Linux ID', async () => {
      const mockFileExists = spyOn(strategy as any, 'fileExists')
        .mockImplementation((path: string) => {
          if (path === '/etc/system-release') return Promise.resolve(false);
          if (path === '/etc/os-release') return Promise.resolve(true);
          return Promise.resolve(false);
        });
      
      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockImplementation((cmd: string) => {
          if (cmd === 'dnf') return Promise.resolve(true);
          return Promise.resolve(false);
        });
      
      const mockReadFile = spyOn(strategy as any, 'readFile')
        .mockResolvedValue('ID="amzn"\nNAME="Amazon Linux"\nVERSION="2023"');

      const result = await strategy.detectDistribution();
      expect(result).toBe(true);

      mockFileExists.mockRestore();
      mockCommandExists.mockRestore();
      mockReadFile.mockRestore();
    });

    it('should return true when os-release contains Amazon Linux NAME', async () => {
      const mockFileExists = spyOn(strategy as any, 'fileExists')
        .mockImplementation((path: string) => {
          if (path === '/etc/system-release') return Promise.resolve(false);
          if (path === '/etc/os-release') return Promise.resolve(true);
          return Promise.resolve(false);
        });
      
      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockImplementation((cmd: string) => {
          if (cmd === 'yum') return Promise.resolve(true);
          return Promise.resolve(false);
        });
      
      const mockReadFile = spyOn(strategy as any, 'readFile')
        .mockResolvedValue('NAME="Amazon Linux"\nVERSION="2023"\nID_LIKE="rhel fedora"');

      const result = await strategy.detectDistribution();
      expect(result).toBe(true);

      mockFileExists.mockRestore();
      mockCommandExists.mockRestore();
      mockReadFile.mockRestore();
    });

    it('should return true when amazon-linux-release file exists', async () => {
      const mockFileExists = spyOn(strategy as any, 'fileExists')
        .mockImplementation((path: string) => {
          if (path === '/etc/system-release') return Promise.resolve(false);
          if (path === '/etc/os-release') return Promise.resolve(false);
          if (path === '/etc/amazon-linux-release') return Promise.resolve(true);
          return Promise.resolve(false);
        });
      
      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockImplementation((cmd: string) => {
          if (cmd === 'dnf') return Promise.resolve(true);
          return Promise.resolve(false);
        });
      
      const mockReadFile = spyOn(strategy as any, 'readFile')
        .mockResolvedValue('');

      const result = await strategy.detectDistribution();
      expect(result).toBe(true);

      mockFileExists.mockRestore();
      mockCommandExists.mockRestore();
      mockReadFile.mockRestore();
    });

    it('should return true when EC2 metadata indicates Amazon Linux environment', async () => {
      const mockFileExists = spyOn(strategy as any, 'fileExists')
        .mockImplementation((path: string) => {
          if (path === '/etc/system-release') return Promise.resolve(false);
          if (path === '/etc/os-release') return Promise.resolve(false);
          if (path === '/etc/amazon-linux-release') return Promise.resolve(false);
          if (path === '/sys/hypervisor/uuid') return Promise.resolve(true);
          return Promise.resolve(false);
        });
      
      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockImplementation((cmd: string) => {
          if (cmd === 'dnf') return Promise.resolve(true);
          return Promise.resolve(false);
        });
      
      const mockReadFile = spyOn(strategy as any, 'readFile')
        .mockImplementation((path: string) => {
          if (path === '/sys/hypervisor/uuid') return Promise.resolve('ec2a1b2c-3d4e-5f6g-7h8i-9j0k1l2m3n4o');
          return Promise.resolve('');
        });

      const result = await strategy.detectDistribution();
      expect(result).toBe(true);

      mockFileExists.mockRestore();
      mockCommandExists.mockRestore();
      mockReadFile.mockRestore();
    });

    it('should return false when neither dnf nor yum commands exist', async () => {
      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockResolvedValue(false);

      const result = await strategy.detectDistribution();
      expect(result).toBe(false);

      mockCommandExists.mockRestore();
    });

    it('should return false when no Amazon Linux identifiers are found', async () => {
      const mockFileExists = spyOn(strategy as any, 'fileExists')
        .mockResolvedValue(false);
      
      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockImplementation((cmd: string) => {
          if (cmd === 'dnf') return Promise.resolve(true);
          return Promise.resolve(false);
        });
      
      const mockReadFile = spyOn(strategy as any, 'readFile')
        .mockResolvedValue('');

      const result = await strategy.detectDistribution();
      expect(result).toBe(false);

      mockFileExists.mockRestore();
      mockCommandExists.mockRestore();
      mockReadFile.mockRestore();
    });
  });

  describe('installPackages', () => {
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
  });

  describe('getPreferredPackageManager', () => {
    it('should return dnf when dnf command exists', async () => {
      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockImplementation((cmd: string) => {
          if (cmd === 'dnf') return Promise.resolve(true);
          return Promise.resolve(false);
        });

      const result = await (strategy as any).getPreferredPackageManager();
      expect(result).toBe('dnf');

      mockCommandExists.mockRestore();
    });

    it('should return yum when dnf command does not exist', async () => {
      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockImplementation((cmd: string) => {
          if (cmd === 'dnf') return Promise.resolve(false);
          return Promise.resolve(true);
        });

      const result = await (strategy as any).getPreferredPackageManager();
      expect(result).toBe('yum');

      mockCommandExists.mockRestore();
    });
  });
});