import { describe, it, expect, beforeEach } from 'bun:test';
import { MinioService } from '../../../src/services/optional/minio.js';
import { ServiceType, DistributionType, HomelabConfig } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

describe('MinioService', () => {
  let service: MinioService;
  let mockConfig: HomelabConfig;
  let mockTemplateEngine: TemplateEngine;

  beforeEach(() => {
    mockConfig = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.MINIO],
      distribution: DistributionType.UBUNTU
    };

    mockTemplateEngine = new TemplateEngine();
    service = new MinioService(mockConfig, mockTemplateEngine);
  });

  describe('constructor', () => {
    it('should create Minio service with correct properties', () => {
      expect(service.name).toBe('Minio');
      expect(service.type).toBe(ServiceType.MINIO);
      expect(service.isCore).toBe(false);
      expect(service.dependencies).toEqual([]);
    });
  });

  describe('getAccessUrl', () => {
    it('should return correct Minio access URL with subdomain', () => {
      const expectedUrl = 'https://minio.homelab.local';
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