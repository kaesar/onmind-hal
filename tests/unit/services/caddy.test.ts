import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { CaddyService } from '../../../src/services/core/caddy.js';
import { ServiceType, HomelabConfig, DistributionType } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

// Mock file system operations
mock.module('fs/promises', () => ({
  writeFile: mock(() => Promise.resolve()),
  mkdir: mock(() => Promise.resolve())
}));

// Mock Bun shell
mock.module('bun', () => ({
  $: mock(() => Promise.resolve({ exitCode: 0, stderr: '' }))
}));

describe('CaddyService', () => {
  let config: HomelabConfig;
  let templateEngine: TemplateEngine;
  let caddyService: CaddyService;

  beforeEach(() => {
    config = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.CADDY, ServiceType.PORTAINER, ServiceType.N8N],
      distribution: DistributionType.UBUNTU
    };

    templateEngine = new TemplateEngine('tests/fixtures/templates');
    caddyService = new CaddyService(config, templateEngine);
  });

  it('should initialize as core service', () => {
    expect(caddyService.name).toBe('Caddy');
    expect(caddyService.type).toBe(ServiceType.CADDY);
    expect(caddyService.isCore).toBe(true);
    expect(caddyService.dependencies).toEqual([]);
  });

  it('should return correct access URL', () => {
    const url = caddyService.getAccessUrl();
    expect(url).toBe('https://homelab.local');
  });

  it('should generate service proxy config correctly', () => {
    const proxyConfig = (caddyService as any).getServiceProxyConfig();
    
    expect(proxyConfig).toHaveLength(2); // Portainer and N8N (Caddy doesn't proxy itself)
    expect(proxyConfig).toContainEqual({
      name: ServiceType.PORTAINER,
      subdomain: 'portainer',
      port: 9000
    });
    expect(proxyConfig).toContainEqual({
      name: ServiceType.N8N,
      subdomain: 'n8n',
      port: 5678
    });
  });

  it('should filter out services without web interfaces', () => {
    config.selectedServices = [ServiceType.CADDY, ServiceType.POSTGRESQL, ServiceType.REDIS];
    caddyService = new CaddyService(config, templateEngine);
    
    const proxyConfig = (caddyService as any).getServiceProxyConfig();
    expect(proxyConfig).toHaveLength(0); // PostgreSQL and Redis have no web interfaces
  });
});