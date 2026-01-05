import { describe, it, expect, beforeEach } from 'bun:test';
import { RabbitMQService } from '../../../src/services/optional/rabbitmq.js';
import { ServiceType, DistributionType, HomelabConfig } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

describe('RabbitMQService', () => {
  let service: RabbitMQService;
  let mockConfig: HomelabConfig;
  let mockTemplateEngine: TemplateEngine;

  beforeEach(() => {
    mockConfig = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.RABBITMQ],
      distribution: DistributionType.UBUNTU
    };

    mockTemplateEngine = new TemplateEngine();
    service = new RabbitMQService(mockConfig, mockTemplateEngine);
  });

  describe('constructor', () => {
    it('should create RabbitMQ service with correct properties', () => {
      expect(service.name).toBe('RabbitMQ');
      expect(service.type).toBe(ServiceType.RABBITMQ);
      expect(service.isCore).toBe(false);
      expect(service.dependencies).toEqual([]);
    });
  });

  describe('getAccessUrl', () => {
    it('should return correct RabbitMQ management URL', () => {
      const expectedUrl = 'http://192.168.1.100:15672';
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
