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

    const arcaneService = factory.createService(ServiceType.ARCANE, config);
    expect(arcaneService.name).toBe('Arcane');
    expect(arcaneService.type).toBe(ServiceType.ARCANE);
    expect(arcaneService.isCore).toBe(true);
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
    expect(services).toHaveLength(4); // 2 core + 2 selected optional
    
    const serviceTypes = services.map(s => s.type);
    expect(serviceTypes).toContain(ServiceType.CADDY);
    expect(serviceTypes).toContain(ServiceType.COPYPARTY);
    expect(serviceTypes).toContain(ServiceType.N8N);
    expect(serviceTypes).toContain(ServiceType.POSTGRESQL);
  });

  it('should return correct core services', () => {
    const coreServices = factory.getCoreServices();
    expect(coreServices).toEqual([
      ServiceType.CADDY,
      ServiceType.COPYPARTY
    ]);
  });

  it('should return correct optional services', () => {
    const optionalServices = factory.getOptionalServices();
    expect(optionalServices).toEqual([
      ServiceType.RUSTFS,
      ServiceType.DUCKDB,
      ServiceType.POSTGRESQL,
      ServiceType.REDIS,
      ServiceType.MONGODB,
      ServiceType.MARIADB,
      ServiceType.SCYLLADB,
      ServiceType.OPENSEARCH,
      ServiceType.QDRANT,
      ServiceType.KAFKA,
      ServiceType.KAFKAUI,
      ServiceType.RABBITMQ,
      ServiceType.OLLAMA,
      ServiceType.OPENWEBUI,
      ServiceType.OPENNOTEBOOKLM,
      ServiceType.N8N,
      ServiceType.TOOLJET,
      ServiceType.KESTRA,
      ServiceType.KEYSTONEJS,
      ServiceType.KEYCLOAK,
      ServiceType.AUTHELIA,
      ServiceType.POCKETID,
      ServiceType.APISIX,
      ServiceType.K3D,
      ServiceType.CODESERVER,
      ServiceType.JUPYTERLAB,
      ServiceType.FORGEJO,
      ServiceType.ONEDEV,
      ServiceType.SEMAPHORE,
      ServiceType.BACKSTAGE,
      ServiceType.LIQUIBASE,
      ServiceType.SONARQUBE,
      ServiceType.TRIVY,
      ServiceType.KARATE,
      ServiceType.RAPIDOC,
      ServiceType.HOPPSCOTCH,
      ServiceType.K6,
      ServiceType.GRAFANA,
      ServiceType.LOKI,
      ServiceType.PROMETHEUS,
      ServiceType.FLUENTBIT,
      ServiceType.COROOT,
      ServiceType.REDASH,
      ServiceType.UPTIMEKUMA,
      ServiceType.DOZZLE,
      ServiceType.HULY,
      ServiceType.INFISCAL,
      ServiceType.FLOCI,
      ServiceType.FLOCIAZ,
      ServiceType.FLOCIGCP,
      ServiceType.LITELLM,
      ServiceType.ANYTHINGLLM,
      ServiceType.VOICEBOX,
      ServiceType.COPILOTKIT,
      ServiceType.GOOSE,
      ServiceType.HERMES,
      ServiceType.OPENCLAW,
      ServiceType.OPENHUMAN,
      ServiceType.FIRECRAWL,
      ServiceType.SEARXNG,
      ServiceType.PLAUSIBLE,
      ServiceType.DOCKHAND,
      ServiceType.REGISTRY,
      ServiceType.NEXUS,
      ServiceType.VAULT,
      ServiceType.CONSUL,
      ServiceType.VAULTWARDEN,
      ServiceType.LINKWARDEN,
      ServiceType.SHLINK,
      ServiceType.SEND,
      ServiceType.FILESTASH,
      ServiceType.SEAFILE,
      ServiceType.EXCALIDRAW,
      ServiceType.DRAWIO,
      ServiceType.WISEMAPPING,
      ServiceType.KROKI,
      ServiceType.PRESENTON,
      ServiceType.SLIDEV,
      ServiceType.OUTLINE,
      ServiceType.GRIST,
      ServiceType.NOCODB,
      ServiceType.TWENTYCRM,
      ServiceType.CHATWOOT,
      ServiceType.MEDUSAJS,
      ServiceType.MATTERMOST,
      ServiceType.CALCOM,
      ServiceType.ADGUARD,
      ServiceType.JASPERREPORTS,
      ServiceType.DOCUSEAL,
      ServiceType.STIRLINGPDF,
      ServiceType.PANDOCWEB,
      ServiceType.CALIBREWEB,
      ServiceType.IMMICH,
      ServiceType.LIBRETRANSLATE,
      ServiceType.DIRECTUS,
      ServiceType.INSFORGE,
      ServiceType.SPARK,
      ServiceType.ORCAROUTERLITE,
      ServiceType.NTFY,
      ServiceType.MAILSERVER,
      ServiceType.LISTMONK,
      ServiceType.CLOUDFLARED,
      ServiceType.HEADSCALE,
      ServiceType.WETTY,
      ServiceType.RUSTDESK,
      ServiceType.ARCANE,
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