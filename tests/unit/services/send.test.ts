import { describe, it, expect, beforeEach } from 'bun:test';
import { SendService } from '../../../src/services/optional/send.js';
import { ServiceType, DistributionType, HomelabConfig } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

describe('SendService', () => {
  let service: SendService;
  let mockConfig: HomelabConfig;
  let mockTemplateEngine: TemplateEngine;

  beforeEach(() => {
    mockConfig = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.SEND],
      distribution: DistributionType.UBUNTU
    };

    mockTemplateEngine = new TemplateEngine();
    service = new SendService(mockConfig, mockTemplateEngine);
  });

  describe('constructor', () => {
    it('should create Send service with correct properties', () => {
      expect(service.name).toBe('Send');
      expect(service.type).toBe(ServiceType.SEND);
      expect(service.isCore).toBe(false);
      expect(service.dependencies).toEqual(['Redis']);
    });
  });

  describe('getAccessUrl', () => {
    it('should return correct Send URL', () => {
      const expectedUrl = 'https://send.homelab.local';
      expect(service.getAccessUrl()).toBe(expectedUrl);
    });
  });

  describe('service properties', () => {
    it('should be an optional service', () => {
      expect(service.isCore).toBe(false);
    });

    it('should have Redis as dependency', () => {
      expect(service.dependencies).toEqual(['Redis']);
    });
  });
});
