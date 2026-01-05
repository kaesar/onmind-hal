import { describe, it, expect, beforeEach } from 'bun:test';
import { TrivyService } from '../../../src/services/optional/trivy.js';
import { ServiceType, DistributionType, HomelabConfig } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

describe('TrivyService', () => {
  let service: TrivyService;
  let mockConfig: HomelabConfig;
  let mockTemplateEngine: TemplateEngine;

  beforeEach(() => {
    mockConfig = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.TRIVY],
      distribution: DistributionType.UBUNTU
    };

    mockTemplateEngine = new TemplateEngine();
    service = new TrivyService(mockConfig, mockTemplateEngine);
  });

  describe('constructor', () => {
    it('should create Trivy service with correct properties', () => {
      expect(service.name).toBe('Trivy');
      expect(service.type).toBe(ServiceType.TRIVY);
      expect(service.isCore).toBe(false);
      expect(service.dependencies).toEqual([]);
    });
  });

  describe('getAccessUrl', () => {
    it('should return correct Trivy URL', () => {
      const expectedUrl = 'http://192.168.1.100:8080';
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
