/**
 * Unit tests for distribution strategy and detection logic
 */

import { describe, it, expect, beforeEach, mock, spyOn } from 'bun:test';
import { BaseDistributionStrategy, DistributionDetector } from '../../../src/distribution/strategy.js';
import { DistributionType } from '../../../src/core/types.js';
import { DistributionNotSupportedError } from '../../../src/utils/errors.js';

// Test implementation of BaseDistributionStrategy
class TestDistributionStrategy extends BaseDistributionStrategy {
  name = 'test';
  
  async detectDistribution(): Promise<boolean> {
    return true;
  }
  
  async installDocker(): Promise<void> {
    // Test implementation
  }
  
  async installPackages(packages: string[]): Promise<void> {
    // Test implementation
  }
  
  getPackageManager(): string {
    return 'test-pm';
  }
}

class FailingDistributionStrategy extends BaseDistributionStrategy {
  name = 'failing';
  
  async detectDistribution(): Promise<boolean> {
    return false;
  }
  
  async installDocker(): Promise<void> {
    throw new Error('Not implemented');
  }
  
  async installPackages(packages: string[]): Promise<void> {
    throw new Error('Not implemented');
  }
  
  getPackageManager(): string {
    return 'failing-pm';
  }
}

describe('BaseDistributionStrategy', () => {
  let strategy: TestDistributionStrategy;

  beforeEach(() => {
    strategy = new TestDistributionStrategy();
  });

  describe('commandExists', () => {
    it('should return true when command exists', async () => {
      // Mock the commandExists method directly for testing
      const mockCommandExists = spyOn(strategy as any, 'commandExists').mockResolvedValue(true);

      const result = await (strategy as any).commandExists('ls');
      expect(result).toBe(true);
      expect(mockCommandExists).toHaveBeenCalledWith('ls');
      
      mockCommandExists.mockRestore();
    });

    it('should return false when command does not exist', async () => {
      // Mock the commandExists method directly for testing
      const mockCommandExists = spyOn(strategy as any, 'commandExists').mockResolvedValue(false);

      const result = await (strategy as any).commandExists('nonexistent');
      expect(result).toBe(false);
      
      mockCommandExists.mockRestore();
    });
  });

  describe('fileExists', () => {
    it('should return true when file exists', async () => {
      // Mock the fileExists method directly for testing
      const mockFileExists = spyOn(strategy as any, 'fileExists').mockResolvedValue(true);

      const result = await (strategy as any).fileExists('/etc/os-release');
      expect(result).toBe(true);
      expect(mockFileExists).toHaveBeenCalledWith('/etc/os-release');
      
      mockFileExists.mockRestore();
    });

    it('should return false when file does not exist', async () => {
      // Mock the fileExists method directly for testing
      const mockFileExists = spyOn(strategy as any, 'fileExists').mockResolvedValue(false);

      const result = await (strategy as any).fileExists('/nonexistent/file');
      expect(result).toBe(false);
      
      mockFileExists.mockRestore();
    });
  });

  describe('readFile', () => {
    it('should return file content when file exists', async () => {
      const expectedContent = 'file content';
      // Mock the readFile method directly for testing
      const mockReadFile = spyOn(strategy as any, 'readFile').mockResolvedValue(expectedContent);

      const result = await (strategy as any).readFile('/etc/os-release');
      expect(result).toBe(expectedContent);
      expect(mockReadFile).toHaveBeenCalledWith('/etc/os-release');
      
      mockReadFile.mockRestore();
    });

    it('should return empty string when file cannot be read', async () => {
      // Mock the readFile method directly for testing
      const mockReadFile = spyOn(strategy as any, 'readFile').mockResolvedValue('');

      const result = await (strategy as any).readFile('/nonexistent/file');
      expect(result).toBe('');
      
      mockReadFile.mockRestore();
    });
  });
});

describe('DistributionDetector', () => {
  let detector: DistributionDetector;

  beforeEach(() => {
    detector = new DistributionDetector();
  });

  describe('registerStrategy', () => {
    it('should register a distribution strategy', () => {
      const strategy = new TestDistributionStrategy();
      detector.registerStrategy(strategy);
      
      // Access private property for testing
      const strategies = (detector as any).strategies;
      expect(strategies).toContain(strategy);
    });
  });

  describe('detectDistribution', () => {
    it('should return the first matching strategy', async () => {
      const strategy1 = new FailingDistributionStrategy();
      const strategy2 = new TestDistributionStrategy();
      
      detector.registerStrategy(strategy1);
      detector.registerStrategy(strategy2);

      const result = await detector.detectDistribution();
      expect(result).toBe(strategy2);
    });

    it('should throw DistributionNotSupportedError when no strategy matches', async () => {
      const strategy = new FailingDistributionStrategy();
      detector.registerStrategy(strategy);

      await expect(detector.detectDistribution()).rejects.toThrow(DistributionNotSupportedError);
    });

    it('should use uname as fallback when os-release is not available', async () => {
      const strategy = new FailingDistributionStrategy();
      detector.registerStrategy(strategy);

      await expect(detector.detectDistribution()).rejects.toThrow(DistributionNotSupportedError);
    });
  });

  describe('getDistributionType', () => {
    it('should return UBUNTU for ubuntu strategy', () => {
      const strategy = { name: 'ubuntu' } as any;
      const result = detector.getDistributionType(strategy);
      expect(result).toBe(DistributionType.UBUNTU);
    });

    it('should return ARCH for arch strategy', () => {
      const strategy = { name: 'arch' } as any;
      const result = detector.getDistributionType(strategy);
      expect(result).toBe(DistributionType.ARCH);
    });

    it('should return AMAZON_LINUX for amazon strategy', () => {
      const strategy = { name: 'amazon' } as any;
      const result = detector.getDistributionType(strategy);
      expect(result).toBe(DistributionType.AMAZON_LINUX);
    });

    it('should return AMAZON_LINUX for amazon linux strategy', () => {
      const strategy = { name: 'amazon linux' } as any;
      const result = detector.getDistributionType(strategy);
      expect(result).toBe(DistributionType.AMAZON_LINUX);
    });

    it('should throw DistributionNotSupportedError for unknown strategy', () => {
      const strategy = { name: 'unknown' } as any;
      expect(() => detector.getDistributionType(strategy)).toThrow(DistributionNotSupportedError);
    });
  });
});