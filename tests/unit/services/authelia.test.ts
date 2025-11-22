import { describe, it, expect, beforeEach } from 'bun:test';
import { AutheliaService } from '../../../src/services/optional/authelia.js';
import { ServiceType, DistributionType, HomelabConfig } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

describe('AutheliaService', () => {
  let service: AutheliaService;
  let mockConfig: HomelabConfig;
  let mockTemplateEngine: TemplateEngine;

  beforeEach(() => {
    mockConfig = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.AUTHELIA, ServiceType.REDIS],
      distribution: DistributionType.UBUNTU
    };

    mockTemplateEngine = new TemplateEngine();
    service = new AutheliaService(mockConfig, mockTemplateEngine);
  });

  describe('constructor', () => {
    it('should create Authelia service with correct properties', () => {
      expect(service.name).toBe('Authelia');
      expect(service.type).toBe(ServiceType.AUTHELIA);
      expect(service.isCore).toBe(false);
      expect(service.dependencies).toEqual([ServiceType.REDIS]);
    });
  });

  describe('getAccessUrl', () => {
    it('should return correct Authelia URL', () => {
      const expectedUrl = 'http://192.168.1.100:9091';
      expect(service.getAccessUrl()).toBe(expectedUrl);
    });
  });

  describe('service properties', () => {
    it('should be an optional service', () => {
      expect(service.isCore).toBe(false);
    });

    it('should have Redis as dependency', () => {
      expect(service.dependencies).toContain(ServiceType.REDIS);
    });
  });
});
