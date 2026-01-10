import { describe, it, expect, beforeEach } from 'bun:test';
import { PsiTransferService } from '../../../src/services/optional/psitransfer.js';
import { ServiceType, DistributionType, HomelabConfig } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

describe('PsiTransferService', () => {
  let service: PsiTransferService;
  let mockConfig: HomelabConfig;
  let mockTemplateEngine: TemplateEngine;

  beforeEach(() => {
    mockConfig = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.PSITRANSFER],
      distribution: DistributionType.UBUNTU
    };

    mockTemplateEngine = new TemplateEngine();
    service = new PsiTransferService(mockConfig, mockTemplateEngine);
  });

  describe('constructor', () => {
    it('should create PsiTransfer service with correct properties', () => {
      expect(service.name).toBe('PsiTransfer');
      expect(service.type).toBe(ServiceType.PSITRANSFER);
      expect(service.isCore).toBe(false);
      expect(service.dependencies).toEqual([]);
    });
  });

  describe('getAccessUrl', () => {
    it('should return correct PsiTransfer URL', () => {
      const expectedUrl = 'https://psitransfer.homelab.local';
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
