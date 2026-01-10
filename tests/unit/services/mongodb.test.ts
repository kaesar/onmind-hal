import { describe, it, expect, beforeEach } from 'bun:test';
import { MongoDBService } from '../../../src/services/optional/mongodb.js';
import { ServiceType, DistributionType, HomelabConfig } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

describe('MongoDBService', () => {
  let service: MongoDBService;
  let mockConfig: HomelabConfig;
  let mockTemplateEngine: TemplateEngine;

  beforeEach(() => {
    mockConfig = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.MONGODB],
      distribution: DistributionType.UBUNTU
    };

    mockTemplateEngine = new TemplateEngine();
    service = new MongoDBService(mockConfig, mockTemplateEngine);
  });

  describe('constructor', () => {
    it('should create MongoDB service with correct properties', () => {
      expect(service.name).toBe('MongoDB');
      expect(service.type).toBe(ServiceType.MONGODB);
      expect(service.isCore).toBe(false);
      expect(service.dependencies).toEqual([]);
    });
  });

  describe('getAccessUrl', () => {
    it('should return correct MongoDB connection URL', () => {
      const expectedUrl = 'mongodb://admin:PASSWORD_NOT_SET@192.168.1.100:27017/admin';
      expect(service.getAccessUrl()).toBe(expectedUrl);
    });

    it('should return correct MongoDB connection URL with password', () => {
      mockConfig.databasePassword = 'secure-password';
      service = new MongoDBService(mockConfig, mockTemplateEngine);
      const expectedUrl = 'mongodb://admin:secure-password@192.168.1.100:27017/admin';
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