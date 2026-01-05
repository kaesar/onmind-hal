import { describe, it, expect, beforeEach } from 'bun:test';
import { SonarQubeService } from '../../../src/services/optional/sonarqube.js';
import { ServiceType, DistributionType, HomelabConfig } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

describe('SonarQubeService', () => {
  let service: SonarQubeService;
  let mockConfig: HomelabConfig;
  let mockTemplateEngine: TemplateEngine;

  beforeEach(() => {
    mockConfig = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.SONARQUBE],
      distribution: DistributionType.UBUNTU
    };

    mockTemplateEngine = new TemplateEngine();
    service = new SonarQubeService(mockConfig, mockTemplateEngine);
  });

  describe('constructor', () => {
    it('should create SonarQube service with correct properties', () => {
      expect(service.name).toBe('SonarQube');
      expect(service.type).toBe(ServiceType.SONARQUBE);
      expect(service.isCore).toBe(false);
      expect(service.dependencies).toEqual([]);
    });
  });

  describe('getAccessUrl', () => {
    it('should return correct SonarQube URL', () => {
      const expectedUrl = 'http://192.168.1.100:9000';
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
