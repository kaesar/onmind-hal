import { describe, it, expect, beforeEach } from 'bun:test';
import { KrokiService } from '../../../src/services/optional/kroki.js';
import { ServiceType, HomelabConfig, DistributionType } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';
import { TemplateLoader } from '../../../src/templates/loader.js';

describe('KrokiService', () => {
  let service: KrokiService;
  let config: HomelabConfig;
  let templateEngine: TemplateEngine;

  beforeEach(() => {
    config = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.KROKI],
      distribution: DistributionType.UBUNTU
    };

    const templateLoader = new TemplateLoader();
    templateEngine = new TemplateEngine(templateLoader);
    service = new KrokiService(config, templateEngine);
  });

  it('should have correct service name', () => {
    expect(service.name).toBe('Kroki');
  });

  it('should have correct service type', () => {
    expect(service.type).toBe(ServiceType.KROKI);
  });

  it('should not be a core service', () => {
    expect(service.isCore).toBe(false);
  });

  it('should have no dependencies', () => {
    expect(service.dependencies).toEqual([]);
  });

  it('should return correct access URL', () => {
    const url = service.getAccessUrl();
    expect(url).toBe('https://kroki.homelab.local');
  });
});
