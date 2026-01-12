import { describe, it, expect, beforeEach } from 'bun:test';
import { VaultwardenService } from '../../../src/services/optional/vaultwarden.js';
import { ServiceType, HomelabConfig, DistributionType } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

describe('VaultwardenService', () => {
  let service: VaultwardenService;
  let config: HomelabConfig;
  let templateEngine: TemplateEngine;

  beforeEach(() => {
    config = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.VAULTWARDEN],
      distribution: DistributionType.UBUNTU
    };
    
    templateEngine = new TemplateEngine('templates');
    service = new VaultwardenService(config, templateEngine);
  });

  it('should initialize as optional service', () => {
    expect(service.name).toBe('Vaultwarden');
    expect(service.type).toBe(ServiceType.VAULTWARDEN);
    expect(service.isCore).toBe(false);
  });

  it('should return correct access URL', () => {
    const expectedUrl = 'https://vaultwarden.homelab.local';
    expect(service.getAccessUrl()).toBe(expectedUrl);
  });

  it('should be an optional service', () => {
    expect(service.isCore).toBe(false);
  });

  it('should have no dependencies', () => {
    expect(service.dependencies).toEqual([]);
  });
});