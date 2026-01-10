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
});