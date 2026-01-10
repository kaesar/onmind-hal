import { describe, it, expect, beforeEach } from 'bun:test';
import { OneDevService } from '../../../src/services/optional/onedev.js';
import { ServiceType, DistributionType, HomelabConfig } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

describe('OneDevService', () => {
  let service: OneDevService;
  let mockConfig: HomelabConfig;
  let mockTemplateEngine: TemplateEngine;

  beforeEach(() => {
    mockConfig = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.ONEDEV],
      distribution: DistributionType.UBUNTU
    };

    mockTemplateEngine = new TemplateEngine();
    service = new OneDevService(mockConfig, mockTemplateEngine);
  });

  describe('constructor', () => {
    it('should create OneDev service with correct properties', () => {
      expect(service.name).toBe('OneDev');
      expect(service.type).toBe(ServiceType.ONEDEV);
      expect(service.isCore).toBe(false);
      expect(service.dependencies).toEqual([]);
    });
  });

  describe('getAccessUrl', () => {
    it('should return correct OneDev URL', () => {
      const expectedUrl = 'https://onedev.homelab.local';
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
