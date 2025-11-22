import { describe, it, expect, beforeEach } from 'bun:test';
import { PalmrService } from '../../../src/services/optional/palmr.js';
import { ServiceType, DistributionType, HomelabConfig } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

describe('PalmrService', () => {
  let service: PalmrService;
  let mockConfig: HomelabConfig;
  let mockTemplateEngine: TemplateEngine;

  beforeEach(() => {
    mockConfig = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.PALMR],
      distribution: DistributionType.UBUNTU
    };

    mockTemplateEngine = new TemplateEngine();
    service = new PalmrService(mockConfig, mockTemplateEngine);
  });

  describe('constructor', () => {
    it('should create Palmr service with correct properties', () => {
      expect(service.name).toBe('Palmr');
      expect(service.type).toBe(ServiceType.PALMR);
      expect(service.isCore).toBe(false);
      expect(service.dependencies).toEqual([]);
    });
  });

  describe('getAccessUrl', () => {
    it('should return correct Palmr URL', () => {
      const expectedUrl = 'http://192.168.1.100:3000';
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
