import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { PostgreSQLService } from '../../../src/services/optional/postgresql.js';
import { ServiceType, HomelabConfig, DistributionType } from '../../../src/core/types.js';
import { ServiceInstallationError } from '../../../src/utils/errors.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

// Mock Bun shell
mock.module('bun', () => ({
  $: mock(() => Promise.resolve({ exitCode: 0, stderr: '' }))
}));

describe('PostgreSQLService', () => {
  let config: HomelabConfig;
  let templateEngine: TemplateEngine;
  let postgresService: PostgreSQLService;

  beforeEach(() => {
    config = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      storagePassword: 'secure-password-123',
      selectedServices: [ServiceType.POSTGRESQL],
      distribution: DistributionType.UBUNTU
    };

    templateEngine = new TemplateEngine('tests/fixtures/templates');
    postgresService = new PostgreSQLService(config, templateEngine);
  });

  it('should initialize as optional service', () => {
    expect(postgresService.name).toBe('PostgreSQL');
    expect(postgresService.type).toBe(ServiceType.POSTGRESQL);
    expect(postgresService.isCore).toBe(false);
    expect(postgresService.dependencies).toEqual([]);
  });

  it('should return correct connection URL with password', () => {
    const url = postgresService.getAccessUrl();
    expect(url).toBe('postgresql://homelab:secure-password-123@192.168.1.100:5432/homelab');
  });

  it('should return safe URL when password is not set', () => {
    config.storagePassword = undefined;
    postgresService = new PostgreSQLService(config, templateEngine);
    
    const url = postgresService.getAccessUrl();
    expect(url).toBe('postgresql://homelab:PASSWORD_NOT_SET@192.168.1.100:5432/homelab');
  });

  it('should throw error during install if password is missing', async () => {
    config.storagePassword = '';
    postgresService = new PostgreSQLService(config, templateEngine);
    
    await expect(postgresService.install()).rejects.toThrow(ServiceInstallationError);
  });

  it('should throw error during install if password is undefined', async () => {
    config.storagePassword = undefined;
    postgresService = new PostgreSQLService(config, templateEngine);
    
    await expect(postgresService.install()).rejects.toThrow(ServiceInstallationError);
  });

  it('should throw error when getting template context without password', () => {
    config.storagePassword = undefined;
    postgresService = new PostgreSQLService(config, templateEngine);
    
    expect(() => {
      (postgresService as any).getTemplateContext();
    }).toThrow(ServiceInstallationError);
  });
});