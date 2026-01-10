import { describe, it, expect, beforeEach } from 'bun:test';
import { ExcalidrawService } from '../../../src/services/optional/excalidraw.js';
import { ServiceType, DistributionType, HomelabConfig } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

describe('ExcalidrawService', () => {
  let service: ExcalidrawService;
  let mockConfig: HomelabConfig;
  let mockTemplateEngine: TemplateEngine;

  beforeEach(() => {
    mockConfig = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.EXCALIDRAW],
      distribution: DistributionType.UBUNTU
    };

    mockTemplateEngine = new TemplateEngine();
    service = new ExcalidrawService(mockConfig, mockTemplateEngine);
  });

  describe('constructor', () => {
    it('should create Excalidraw service with correct properties', () => {
      expect(service.name).toBe('Excalidraw');
      expect(service.type).toBe(ServiceType.EXCALIDRAW);
      expect(service.isCore).toBe(false);
      expect(service.dependencies).toEqual([]);
    });
  });

  describe('getAccessUrl', () => {
    it('should return correct Excalidraw URL', () => {
      const expectedUrl = 'https://excalidraw.homelab.local';
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
