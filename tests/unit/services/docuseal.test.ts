import { describe, it, expect, beforeEach } from 'bun:test';
import { DocuSealService } from '../../../src/services/optional/docuseal.js';
import { ServiceType, HomelabConfig, DistributionType } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

describe('DocuSealService', () => {
  let service: DocuSealService;
  let config: HomelabConfig;
  let templateEngine: TemplateEngine;

  beforeEach(() => {
    config = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.DOCUSEAL],
      distribution: DistributionType.UBUNTU
    };
    templateEngine = new TemplateEngine('templates');
    service = new DocuSealService(config, templateEngine);
  });

  it('should have correct service name', () => {
    expect(service.name).toBe('DocuSeal');
  });

  it('should have correct service type', () => {
    expect(service.type).toBe(ServiceType.DOCUSEAL);
  });

  it('should not be a core service', () => {
    expect(service.isCore).toBe(false);
  });

  it('should have no dependencies', () => {
    expect(service.dependencies).toEqual([]);
  });

  it('should return correct access URL', () => {
    expect(service.getAccessUrl()).toBe('https://docuseal.homelab.local');
  });
});