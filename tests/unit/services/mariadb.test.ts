import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { MariaDBService } from '../../../src/services/optional/mariadb.js';
import { ServiceType, HomelabConfig, DistributionType } from '../../../src/core/types.js';
import { ServiceInstallationError } from '../../../src/utils/errors.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

// Mock Bun shell
mock.module('bun', () => ({
  $: mock(() => Promise.resolve({ exitCode: 0, stderr: '' }))
}));

describe('MariaDBService', () => {
  let config: HomelabConfig;
  let templateEngine: TemplateEngine;
  let mariadbService: MariaDBService;

  beforeEach(() => {
    config = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      databasePassword: 'secure-mariadb-password-123',
      selectedServices: [ServiceType.MARIADB],
      distribution: DistributionType.UBUNTU
    };

    templateEngine = new TemplateEngine('tests/fixtures/templates');
    mariadbService = new MariaDBService(config, templateEngine);
  });

  it('should initialize as optional service', () => {
    expect(mariadbService.name).toBe('MariaDB');
    expect(mariadbService.type).toBe(ServiceType.MARIADB);
    expect(mariadbService.isCore).toBe(false);
    expect(mariadbService.dependencies).toEqual([]);
  });

  it('should return correct connection URL with password', () => {
    const url = mariadbService.getAccessUrl();
    expect(url).toBe('mysql://homelab:secure-mariadb-password-123@192.168.1.100:3306/homelab');
  });

  it('should return safe URL when password is not set', () => {
    config.databasePassword = undefined;
    mariadbService = new MariaDBService(config, templateEngine);
    
    const url = mariadbService.getAccessUrl();
    expect(url).toBe('mysql://homelab:PASSWORD_NOT_SET@192.168.1.100:3306/homelab');
  });

  it('should throw error during install if password is missing', async () => {
    config.databasePassword = '';
    mariadbService = new MariaDBService(config, templateEngine);
    
    await expect(mariadbService.install()).rejects.toThrow(ServiceInstallationError);
  });

  it('should throw error during install if password is undefined', async () => {
    config.databasePassword = undefined;
    mariadbService = new MariaDBService(config, templateEngine);
    
    await expect(mariadbService.install()).rejects.toThrow(ServiceInstallationError);
  });

  it('should throw error when getting template context without password', () => {
    config.databasePassword = undefined;
    mariadbService = new MariaDBService(config, templateEngine);
    
    expect(() => {
      (mariadbService as any).getTemplateContext();
    }).toThrow(ServiceInstallationError);
  });
});