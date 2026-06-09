import { describe, it, expect, beforeEach } from 'bun:test';
import { K6Service } from '../../../src/services/optional/k6.js';
import { ServiceType, HomelabConfig, DistributionType } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

describe('K6Service', () => {
  let service: K6Service;
  let config: HomelabConfig;
  let templateEngine: TemplateEngine;

  beforeEach(() => {
    config = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.K6],
      distribution: DistributionType.UBUNTU
    };

    templateEngine = new TemplateEngine();
    service = new K6Service(config, templateEngine);
  });

  it('should have correct service name', () => {
    expect(service.name).toBe('K6');
  });

  it('should have correct service type', () => {
    expect(service.type).toBe(ServiceType.K6);
  });

  it('should not be a core service', () => {
    expect(service.isCore).toBe(false);
  });

  it('should have no dependencies', () => {
    expect(service.dependencies).toEqual([]);
  });

  it('should return correct access URL', () => {
    const url = service.getAccessUrl();
    expect(url).toBe('https://k6.homelab.local');
  });
});
