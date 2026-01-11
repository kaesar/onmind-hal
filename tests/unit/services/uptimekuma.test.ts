import { describe, it, expect } from 'bun:test';
import { UptimeKumaService } from '../../../src/services/optional/uptimekuma.js';
import { ServiceType, HomelabConfig, DistributionType } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

describe('UptimeKumaService', () => {
  const mockConfig: HomelabConfig = {
    ip: '192.168.1.100',
    domain: 'homelab.local',
    networkName: 'homelab-network',
    selectedServices: [ServiceType.UPTIMEKUMA],
    distribution: DistributionType.UBUNTU
  };

  const mockTemplateEngine = new TemplateEngine();

  it('should initialize as optional service', () => {
    const service = new UptimeKumaService(mockConfig, mockTemplateEngine);
    
    expect(service.name).toBe('Uptime Kuma');
    expect(service.type).toBe(ServiceType.UPTIMEKUMA);
    expect(service.isCore).toBe(false);
  });

  it('should return correct access URL', () => {
    const service = new UptimeKumaService(mockConfig, mockTemplateEngine);
    
    expect(service.getAccessUrl()).toBe('https://uptimekuma.homelab.local');
  });

  it('should be an optional service', () => {
    const service = new UptimeKumaService(mockConfig, mockTemplateEngine);
    
    expect(service.isCore).toBe(false);
  });

  it('should have no dependencies', () => {
    const service = new UptimeKumaService(mockConfig, mockTemplateEngine);
    
    expect(service.dependencies).toEqual([]);
  });
});