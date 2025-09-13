import { describe, it, expect, beforeEach } from 'bun:test';
import { OllamaService } from '../../../src/services/optional/ollama.js';
import { ServiceType, DistributionType, HomelabConfig } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

describe('OllamaService', () => {
  let service: OllamaService;
  let mockConfig: HomelabConfig;
  let mockTemplateEngine: TemplateEngine;

  beforeEach(() => {
    mockConfig = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.OLLAMA],
      distribution: DistributionType.UBUNTU
    };

    mockTemplateEngine = new TemplateEngine();
    service = new OllamaService(mockConfig, mockTemplateEngine);
  });

  describe('constructor', () => {
    it('should create Ollama service with correct properties', () => {
      expect(service.name).toBe('Ollama');
      expect(service.type).toBe(ServiceType.OLLAMA);
      expect(service.isCore).toBe(false);
      expect(service.dependencies).toEqual([]);
    });
  });

  describe('getAccessUrl', () => {
    it('should return correct Ollama access URL with subdomain', () => {
      const expectedUrl = 'https://ollama.homelab.local';
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