import { describe, it, expect, beforeEach } from 'bun:test';
import { RegistryService } from '../../../src/services/optional/registry.js';
import { ServiceType, DistributionType, HomelabConfig } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

describe('RegistryService', () => {
  let service: RegistryService;
  let mockConfig: HomelabConfig;
  let mockTemplateEngine: TemplateEngine;

  beforeEach(() => {
    mockConfig = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.REGISTRY],
      distribution: DistributionType.UBUNTU
    };

    mockTemplateEngine = new TemplateEngine();
    service = new RegistryService(mockConfig, mockTemplateEngine);
  });

  describe('constructor', () => {
    it('should create Registry service with correct properties', () => {
      expect(service.name).toBe('Registry');
      expect(service.type).toBe(ServiceType.REGISTRY);
      expect(service.isCore).toBe(false);
      expect(service.dependencies).toEqual([]);
    });
  });

  describe('getAccessUrl', () => {
    it('should return correct Registry URL', () => {
      const expectedUrl = 'https://registry.homelab.local';
      expect(service.getAccessUrl()).toBe(expectedUrl);
    });
  });

  describe('service properties', () => {
    it('should be an optional service', () => {
      expect(service.isCore).toBe(false);
    });

    it('should have no dependencies', () => {
      expect(service.dependencies).toEqual([]);
    });
  });
});
