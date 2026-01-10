import { describe, it, expect, beforeEach } from 'bun:test';
import { OutlineService } from '../../../src/services/optional/outline.js';
import { ServiceType, DistributionType, HomelabConfig } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

describe('OutlineService', () => {
  let service: OutlineService;
  let mockConfig: HomelabConfig;
  let mockTemplateEngine: TemplateEngine;

  beforeEach(() => {
    mockConfig = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.OUTLINE, ServiceType.POSTGRESQL, ServiceType.REDIS],
      distribution: DistributionType.UBUNTU
    };

    mockTemplateEngine = new TemplateEngine();
    service = new OutlineService(mockConfig, mockTemplateEngine);
  });

  describe('constructor', () => {
    it('should create Outline service with correct properties', () => {
      expect(service.name).toBe('Outline');
      expect(service.type).toBe(ServiceType.OUTLINE);
      expect(service.isCore).toBe(false);
      expect(service.dependencies).toEqual([ServiceType.POSTGRESQL, ServiceType.REDIS]);
    });
  });

  describe('getAccessUrl', () => {
    it('should return correct Outline URL', () => {
      const expectedUrl = 'https://outline.homelab.local';
      expect(service.getAccessUrl()).toBe(expectedUrl);
    });
  });

  describe('service properties', () => {
    it('should be an optional service', () => {
      expect(service.isCore).toBe(false);
    });

    it('should have PostgreSQL and Redis as dependencies', () => {
      expect(service.dependencies).toContain(ServiceType.POSTGRESQL);
      expect(service.dependencies).toContain(ServiceType.REDIS);
    });
  });
});
