import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { BaseService } from '../../../src/services/base.js';
import { ServiceType, HomelabConfig, DistributionType } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

// Mock Bun shell
const mockShell = mock(() => Promise.resolve({ exitCode: 0, stderr: '' }));
mock.module('bun', () => ({
  $: mockShell
}));

// Create a concrete implementation for testing
class TestService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super('Test Service', ServiceType.CADDY, true, [], config, templateEngine);
  }
}

describe('BaseService', () => {
  let config: HomelabConfig;
  let templateEngine: TemplateEngine;
  let service: TestService;

  beforeEach(() => {
    config = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.CADDY],
      distribution: DistributionType.UBUNTU
    };

    templateEngine = new TemplateEngine('tests/fixtures/templates');
    service = new TestService(config, templateEngine);
  });

  it('should initialize with correct properties', () => {
    expect(service.name).toBe('Test Service');
    expect(service.type).toBe(ServiceType.CADDY);
    expect(service.isCore).toBe(true);
    expect(service.dependencies).toEqual([]);
  });

  it('should generate correct template context', () => {
    const context = (service as any).getTemplateContext();
    
    expect(context.ip).toBe('192.168.1.100');
    expect(context.domain).toBe('homelab.local');
    expect(context.networkName).toBe('homelab-network');
    expect(context.databasePassword).toBe('');
  });

  it('should interpolate command variables correctly', () => {
    const command = 'docker run --network {{networkName}} --name {{domain}}';
    const context = { networkName: 'test-network', domain: 'test.local' };
    
    const interpolated = (service as any).interpolateCommand(command, context);
    expect(interpolated).toBe('docker run --network test-network --name test.local');
  });

  it('should throw error for missing variables in command', () => {
    const command = 'docker run --network {{networkName}} --name {{missingVar}}';
    const context = { networkName: 'test-network' };
    
    expect(() => {
      (service as any).interpolateCommand(command, context);
    }).toThrow();
  });

  it('should check dependencies successfully', async () => {
    const result = await service.checkDependencies();
    expect(result).toBe(true);
  });
});