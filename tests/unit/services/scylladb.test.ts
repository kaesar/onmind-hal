import { describe, it, expect, beforeEach } from 'bun:test';
import { ScyllaDBService } from '../../../src/services/optional/scylladb.js';
import { ServiceType, HomelabConfig, DistributionType } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

describe('ScyllaDBService', () => {
  let scylladbService: ScyllaDBService;
  let mockConfig: HomelabConfig;
  let mockTemplateEngine: TemplateEngine;

  beforeEach(() => {
    mockConfig = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.SCYLLADB],
      distribution: DistributionType.UBUNTU
    };

    mockTemplateEngine = {
      load: async () => ({ content: '{}', variables: {} }),
      render: () => 'rendered content'
    } as any;

    scylladbService = new ScyllaDBService(mockConfig, mockTemplateEngine);
  });

  it('should initialize as optional service', () => {
    expect(scylladbService.name).toBe('ScyllaDB');
    expect(scylladbService.type).toBe(ServiceType.SCYLLADB);
    expect(scylladbService.isCore).toBe(false);
    expect(scylladbService.dependencies).toEqual([]);
  });

  it('should return correct CQL connection URL', () => {
    const url = scylladbService.getAccessUrl();
    expect(url).toBe('cql://192.168.1.100:9042');
  });

  it('should be an optional service', () => {
    expect(scylladbService.isCore).toBe(false);
  });

  it('should have no dependencies', () => {
    expect(scylladbService.dependencies).toEqual([]);
  });
});