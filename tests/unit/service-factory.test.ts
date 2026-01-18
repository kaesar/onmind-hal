import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { ServiceFactory } from '../../src/services/factory.js';
import { ServiceType, HomelabConfig, DistributionType } from '../../src/core/types.js';
import { ServiceInstallationError } from '../../src/utils/errors.js';
import { TemplateEngine } from '../../src/templates/engine.js';

// Mock Bun shell
mock.module('bun', () => ({
  $: mock(() => Promise.resolve({ exitCode: 0, stderr: '' }))
}));

describe('ServiceFactory', () => {
  let factory: ServiceFactory;
  let templateEngine: TemplateEngine;
  let config: HomelabConfig;

  beforeEach(() => {
    templateEngine = new TemplateEngine('tests/fixtures/templates');
    factory = new ServiceFactory(templateEngine);
    
    config = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.N8N, ServiceType.POSTGRESQL],
      distribution: DistributionType.UBUNTU,
      storagePassword: 'secure-password'
    };
  });

  it('should create core services correctly', () => {
    const caddyService = factory.createService(ServiceType.CADDY, config);
    expect(caddyService.name).toBe('Caddy');
    expect(caddyService.type).toBe(ServiceType.CADDY);
    expect(caddyService.isCore).toBe(true);

    const portainerService = factory.createService(ServiceType.PORTAINER, config);
    expect(portainerService.name).toBe('Portainer');
    expect(portainerService.type).toBe(ServiceType.PORTAINER);
    expect(portainerService.isCore).toBe(true);
  });

  it('should create optional services correctly', () => {
    const n8nService = factory.createService(ServiceType.N8N, config);
    expect(n8nService.name).toBe('n8n');
    expect(n8nService.type).toBe(ServiceType.N8N);
    expect(n8nService.isCore).toBe(false);

    const postgresService = factory.createService(ServiceType.POSTGRESQL, config);
    expect(postgresService.name).toBe('PostgreSQL');
    expect(postgresService.type).toBe(ServiceType.POSTGRESQL);
    expect(postgresService.isCore).toBe(false);
  });

  it('should cache service instances', () => {
    const service1 = factory.createService(ServiceType.CADDY, config);
    const service2 = factory.createService(ServiceType.CADDY, config);
    
    expect(service1).toBe(service2); // Same instance
  });

  it('should throw error for unknown service type', () => {
    expect(() => {
      factory.createService('UNKNOWN' as ServiceType, config);
    }).toThrow(ServiceInstallationError);
  });

  it('should create all services based on configuration', () => {
    const services = factory.createServices(config);
    
    // Should include all core services + selected optional services
    expect(services).toHaveLength(5); // 3 core + 2 selected optional
    
    const serviceTypes = services.map(s => s.type);
    expect(serviceTypes).toContain(ServiceType.CADDY);
    expect(serviceTypes).toContain(ServiceType.PORTAINER);
    expect(serviceTypes).toContain(ServiceType.COPYPARTY);
    expect(serviceTypes).toContain(ServiceType.N8N);
    expect(serviceTypes).toContain(ServiceType.POSTGRESQL);
  });

  it('should return correct core services', () => {
    const coreServices = factory.getCoreServices();
    expect(coreServices).toEqual([
      ServiceType.CADDY,
      ServiceType.PORTAINER,
      ServiceType.COPYPARTY
    ]);
  });

  it('should return correct optional services', () => {
    const optionalServices = factory.getOptionalServices();
    expect(optionalServices).toEqual([
      ServiceType.DUCKDB,
      ServiceType.POSTGRESQL,
      ServiceType.REDIS,
      ServiceType.MONGODB,
      ServiceType.MARIADB,
      ServiceType.SCYLLADB,
      ServiceType.MINIO,
      ServiceType.KAFKA,
      ServiceType.RABBITMQ,
      ServiceType.OLLAMA,
      ServiceType.OPENNOTEBOOKLM,
      ServiceType.N8N,
      ServiceType.KESTRA,
      ServiceType.KEYSTONEJS,
      ServiceType.KEYCLOAK,
      ServiceType.AUTHELIA,
      ServiceType.POCKETID,
      ServiceType.LOCALSTACK,
      ServiceType.K3D,
      ServiceType.ONEDEV,
      ServiceType.SEMAPHORE,
      ServiceType.BACKSTAGE,
      ServiceType.LIQUIBASE,
      ServiceType.SONARQUBE,
      ServiceType.TRIVY,
      ServiceType.RAPIDOC,
      ServiceType.HOPPSCOTCH,
      ServiceType.LOCUST,
      ServiceType.GRAFANA,
      ServiceType.LOKI,
      ServiceType.OPENSEARCH,
      ServiceType.FLUENTBIT,
      ServiceType.UPTIMEKUMA,
      ServiceType.REGISTRY,
      ServiceType.NEXUS,
      ServiceType.VAULT,
      ServiceType.VAULTWARDEN,
      ServiceType.PSITRANSFER,
      ServiceType.EXCALIDRAW,
      ServiceType.DRAWIO,
      ServiceType.KROKI,
      ServiceType.OUTLINE,
      ServiceType.GRIST,
      ServiceType.NOCODB,
      ServiceType.TWENTYCRM,
      ServiceType.MEDUSAJS,
      ServiceType.PLANE,
      ServiceType.JASPERREPORTS,
      ServiceType.STIRLINGPDF,
      ServiceType.LIBRETRANSLATE,
      ServiceType.MAILSERVER,
      ServiceType.FRP,
    ]);
  });

  it('should validate configuration successfully', () => {
    expect(() => {
      factory.validateConfiguration(config);
    }).not.toThrow();
  });

  it('should throw error when PostgreSQL is selected without password', () => {
    config.storagePassword = '';
    
    expect(() => {
      factory.validateConfiguration(config);
    }).toThrow(ServiceInstallationError);
  });

  it('should throw error for invalid service type in configuration', () => {
    config.selectedServices = ['INVALID' as ServiceType];
    
    expect(() => {
      factory.validateConfiguration(config);
    }).toThrow(ServiceInstallationError);
  });

  it('should order services with core services first', () => {
    const services = factory.createServices(config);
    const orderedServices = factory.getInstallationOrder(services);
    
    // Core services should come first
    const coreServiceCount = factory.getCoreServices().length;
    for (let i = 0; i < coreServiceCount; i++) {
      expect(orderedServices[i].isCore).toBe(true);
    }
    
    // Optional services should come after
    for (let i = coreServiceCount; i < orderedServices.length; i++) {
      expect(orderedServices[i].isCore).toBe(false);
    }
  });

  it('should clear cache correctly', () => {
    factory.createService(ServiceType.CADDY, config);
    expect(factory.getCachedServices().size).toBe(1);
    
    factory.clearCache();
    expect(factory.getCachedServices().size).toBe(0);
  });
});