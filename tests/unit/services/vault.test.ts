import { describe, it, expect, beforeEach } from 'bun:test';
import { VaultService } from '../../../src/services/optional/vault.js';
import { ServiceType, DistributionType, HomelabConfig } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

describe('VaultService', () => {
  let service: VaultService;
  let mockConfig: HomelabConfig;
  let mockTemplateEngine: TemplateEngine;

  beforeEach(() => {
    mockConfig = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.VAULT],
      distribution: DistributionType.UBUNTU
    };

    mockTemplateEngine = new TemplateEngine();
    service = new VaultService(mockConfig, mockTemplateEngine);
  });

  describe('constructor', () => {
    it('should create Vault service with correct properties', () => {
      expect(service.name).toBe('Vault');
      expect(service.type).toBe(ServiceType.VAULT);
      expect(service.isCore).toBe(false);
      expect(service.dependencies).toEqual([]);
    });
  });

  describe('getAccessUrl', () => {
    it('should return correct Vault URL', () => {
      const expectedUrl = 'http://192.168.1.100:8200';
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
