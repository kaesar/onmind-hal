import { describe, it, expect, beforeEach } from 'bun:test';
import { KafkaService } from '../../../src/services/optional/kafka.js';
import { ServiceType, DistributionType, HomelabConfig } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

describe('KafkaService', () => {
  let service: KafkaService;
  let mockConfig: HomelabConfig;
  let mockTemplateEngine: TemplateEngine;

  beforeEach(() => {
    mockConfig = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.KAFKA],
      distribution: DistributionType.UBUNTU
    };

    mockTemplateEngine = new TemplateEngine();
    service = new KafkaService(mockConfig, mockTemplateEngine);
  });

  describe('constructor', () => {
    it('should create Kafka service with correct properties', () => {
      expect(service.name).toBe('Kafka');
      expect(service.type).toBe(ServiceType.KAFKA);
      expect(service.isCore).toBe(false);
      expect(service.dependencies).toEqual([]);
    });
  });

  describe('getAccessUrl', () => {
    it('should return correct Kafka connection URL', () => {
      const expectedUrl = 'kafka://192.168.1.100:9092';
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
