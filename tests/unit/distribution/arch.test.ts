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