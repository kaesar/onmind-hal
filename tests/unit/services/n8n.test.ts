import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { N8nService } from '../../../src/services/optional/n8n.js';
import { ServiceType, HomelabConfig, DistributionType } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

// Mock Bun shell
mock.module('bun', () => ({
  $: mock(() => Promise.resolve({ exitCode: 0, stderr: '' }))
}));

describe('N8nService', () => {
  let config: HomelabConfig;
  let templateEngine: TemplateEngine;
  let n8nService: N8nService;

  beforeEach(() => {
    config = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.N8N],
      distribution: DistributionType.UBUNTU
    };

    templateEngine = new TemplateEngine('tests/fixtures/templates');
    n8nService = new N8nService(config, templateEngine);
  });

  it('should initialize as optional service', () => {
    expect(n8nService.name).toBe('n8n');
    expect(n8nService.type).toBe(ServiceType.N8N);
    expect(n8nService.isCore).toBe(false);
    expect(n8nService.dependencies).toEqual([]);
  });

  it('should return correct access URL', () => {
    const url = n8nService.getAccessUrl();
    expect(url).toBe('https://n8n.homelab.local');
  });
});