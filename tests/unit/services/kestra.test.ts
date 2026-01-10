import { describe, it, expect, beforeEach } from 'bun:test';
import { KestraService } from '../../../src/services/optional/kestra.js';
import { ServiceType, DistributionType, HomelabConfig } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

describe('KestraService', () => {
  let service: KestraService;
  let mockConfig: HomelabConfig;
  let mockTemplateEngine: TemplateEngine;

  beforeEach(() => {
    mockConfig = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.KESTRA],
      distribution: DistributionType.UBUNTU
    };

    mockTemplateEngine = new TemplateEngine();
    service = new KestraService(mockConfig, mockTemplateEngine);
  });

  describe('constructor', () => {
    it('should create Kestra service with correct properties', () => {
      expect(service.name).toBe('Kestra');
      expect(service.type).toBe(ServiceType.KESTRA);
      expect(service.isCore).toBe(false);
      expect(service.dependencies).toEqual([]);
    });
  });

  describe('getAccessUrl', () => {
    it('should return correct Kestra URL', () => {
      const expectedUrl = 'https://kestra.homelab.local';
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
