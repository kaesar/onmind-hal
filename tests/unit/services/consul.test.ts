import { describe, it, expect, beforeEach } from 'bun:test';
import { ConsulService } from '../../../src/services/optional/consul.js';
import { ServiceType, HomelabConfig, DistributionType } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

describe('ConsulService', () => {
  let service: ConsulService;
  let config: HomelabConfig;
  let templateEngine: TemplateEngine;

  beforeEach(() => {
    config = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.CONSUL],
      distribution: DistributionType.UBUNTU
    };

    templateEngine = new TemplateEngine();
    service = new ConsulService(config, templateEngine);
  });

  it('should have correct service name', () => {
    expect(service.name).toBe('Consul');
  });

  it('should have correct service type', () => {
    expect(service.type).toBe(ServiceType.CONSUL);
  });

  it('should not be a core service', () => {
    expect(service.isCore).toBe(false);
  });

  it('should have no dependencies', () => {
    expect(service.dependencies).toEqual([]);
  });

  it('should return correct access URL', () => {
    const url = service.getAccessUrl();
    expect(url).toBe('https://consul.homelab.local');
  });
});
