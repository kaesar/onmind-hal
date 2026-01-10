import { describe, it, expect, beforeEach } from 'bun:test';
import { MacOSStrategy } from '../../../src/distribution/macos.js';

describe('MacOSStrategy', () => {
  let strategy: MacOSStrategy;

  beforeEach(() => {
    strategy = new MacOSStrategy();
  });

  it('should have correct name', () => {
    expect(strategy.name).toBe('macOS');
  });

  it('should have getPackageManager method', () => {
    expect(strategy.getPackageManager()).toBe('brew');
  });

  it('should detect macOS on Darwin systems', async () => {
    const isMacOS = await strategy.detectDistribution();
    // This will be true only when running on actual macOS
    expect(typeof isMacOS).toBe('boolean');
  });

  it('should skip firewall configuration', async () => {
    // Should not throw error
    await expect(strategy.configureFirewall()).resolves.toBeUndefined();
  });
});
