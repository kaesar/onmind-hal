import { describe, it, expect, beforeEach } from 'bun:test';
import { LocalStackService } from '../../../src/services/optional/localstack.js';
import { ServiceType, DistributionType, HomelabConfig } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

describe('LocalStackService', () => {
  let service: LocalStackService;
  let mockConfig: HomelabConfig;
  let mockTemplateEngine: TemplateEngine;

  beforeEach(() => {
    mockConfig = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.LOCALSTACK],
      distribution: DistributionType.UBUNTU
    };

    mockTemplateEngine = new TemplateEngine();
    service = new LocalStackService(mockConfig, mockTemplateEngine);
  });

  describe('constructor', () => {
    it('should create LocalStack service with correct properties', () => {
      expect(service.name).toBe('LocalStack');
      expect(service.type).toBe(ServiceType.LOCALSTACK);
      expect(service.isCore).toBe(false);
      expect(service.dependencies).toEqual([]);
    });
  });

  describe('getAccessUrl', () => {
    it('should return correct LocalStack URL', () => {
      const expectedUrl = 'https://localstack.homelab.local';
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
