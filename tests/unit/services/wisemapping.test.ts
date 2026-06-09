import { describe, it, expect, beforeEach } from 'bun:test';
import { WiseMappingService } from '../../../src/services/optional/wisemapping.js';
import { ServiceType, HomelabConfig, DistributionType } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

describe('WiseMappingService', () => {
  let service: WiseMappingService;
  let config: HomelabConfig;
  let templateEngine: TemplateEngine;

  beforeEach(() => {
    config = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.WISEMAPPING],
      distribution: DistributionType.UBUNTU
    };

    templateEngine = new TemplateEngine();
    service = new WiseMappingService(config, templateEngine);
  });

  it('should have correct service name', () => {
    expect(service.name).toBe('WiseMapping');
  });

  it('should have correct service type', () => {
    expect(service.type).toBe(ServiceType.WISEMAPPING);
  });

  it('should not be a core service', () => {
    expect(service.isCore).toBe(false);
  });

  it('should have no dependencies', () => {
    expect(service.dependencies).toEqual([]);
  });

  it('should return correct access URL', () => {
    const url = service.getAccessUrl();
    expect(url).toBe('https://wisemapping.homelab.local');
  });
});
