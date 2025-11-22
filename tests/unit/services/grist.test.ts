import { describe, it, expect, beforeEach } from 'bun:test';
import { GristService } from '../../../src/services/optional/grist.js';
import { ServiceType, DistributionType, HomelabConfig } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

describe('GristService', () => {
  let service: GristService;
  let mockConfig: HomelabConfig;
  let mockTemplateEngine: TemplateEngine;

  beforeEach(() => {
    mockConfig = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.GRIST],
      distribution: DistributionType.UBUNTU
    };

    mockTemplateEngine = new TemplateEngine();
    service = new GristService(mockConfig, mockTemplateEngine);
  });

  describe('constructor', () => {
    it('should create Grist service with correct properties', () => {
      expect(service.name).toBe('Grist');
      expect(service.type).toBe(ServiceType.GRIST);
      expect(service.isCore).toBe(false);
      expect(service.dependencies).toEqual([]);
    });
  });

  describe('getAccessUrl', () => {
    it('should return correct Grist URL', () => {
      const expectedUrl = 'http://192.168.1.100:8484';
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
