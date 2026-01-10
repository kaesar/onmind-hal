import { Service, ServiceType, HomelabConfig } from '../core/types.js';
import { ServiceInstallationError } from '../utils/errors.js';
import { TemplateEngine } from '../templates/engine.js';

// Core services
import { CaddyService } from './core/caddy.js';
import { PortainerService } from './core/portainer.js';
import { CopypartyService } from './core/copyparty.js';
import { DuckDBService } from './core/duckdb.js';

// Optional services
import { PostgreSQLService } from './optional/postgresql.js';
import { RedisService } from './optional/redis.js';
import { MongoDBService } from './optional/mongodb.js';
import { MariaDBService } from './optional/mariadb.js';
import { MinioService } from './optional/minio.js';
import { KafkaService } from './optional/kafka.js';
import { RabbitMQService } from './optional/rabbitmq.js';
import { OllamaService } from './optional/ollama.js';
import { N8nService } from './optional/n8n.js';
import { KestraService } from './optional/kestra.js';
import { KeystoneJSService } from './optional/keystonejs.js';
import { CockpitService } from './optional/cockpit.js';
import { AutheliaService } from './optional/authelia.js';
import { LocalStackService } from './optional/localstack.js';
import { OneDevService } from './optional/onedev.js';
import { SonarQubeService } from './optional/sonarqube.js';
import { TrivyService } from './optional/trivy.js';
import { RapiDocService } from './optional/rapidoc.js';
import { GrafanaService } from './optional/grafana.js';
import { LokiService } from './optional/loki.js';
import { FluentBitService } from './optional/fluentbit.js';
import { RegistryService } from './optional/registry.js';
import { NexusService } from './optional/nexus.js';
import { VaultService } from './optional/vault.js';
import { PsiTransferService } from './optional/psitransfer.js';
import { ExcalidrawService } from './optional/excalidraw.js';
import { DrawIOService } from './optional/drawio.js';
import { KrokiService } from './optional/kroki.js';
import { OutlineService } from './optional/outline.js';
import { GristService } from './optional/grist.js';
import { NocoDBService } from './optional/nocodb.js';
import { JasperReportsService } from './optional/jasperreports.js';
import { DocuSealService } from './optional/docuseal.js';
import { LibreTranslateService } from './optional/libretranslate.js';
import { MailserverService } from './optional/mailserver.js';
import { FrpService } from './optional/frp.js';

/**
 * Service factory for creating service instances based on configuration
 * Implements dependency resolution and installation ordering
 */
export class ServiceFactory {
  private templateEngine: TemplateEngine;
  private serviceInstances = new Map<ServiceType, Service>();

  constructor(templateEngine: TemplateEngine) {
    this.templateEngine = templateEngine;
  }

  /**
   * Create a service instance based on service type
   * @param serviceType Type of service to create
   * @param config HomeLab configuration
   * @returns Service instance
   */
  createService(serviceType: ServiceType, config: HomelabConfig): Service {
    // Check if service instance already exists
    if (this.serviceInstances.has(serviceType)) {
      return this.serviceInstances.get(serviceType)!;
    }

    let service: Service;

    switch (serviceType) {
      case ServiceType.CADDY:
        service = new CaddyService(config, this.templateEngine);
        break;
      case ServiceType.PORTAINER:
        service = new PortainerService(config, this.templateEngine);
        break;
      case ServiceType.COPYPARTY:
        service = new CopypartyService(config, this.templateEngine);
        break;
      case ServiceType.DUCKDB:
        service = new DuckDBService(config, this.templateEngine);
        break;

      case ServiceType.POSTGRESQL:
        service = new PostgreSQLService(config, this.templateEngine);
        break;
      case ServiceType.REDIS:
        service = new RedisService(config, this.templateEngine);
        break;
      case ServiceType.MONGODB:
        service = new MongoDBService(config, this.templateEngine);
        break;
      case ServiceType.MARIADB:
        service = new MariaDBService(config, this.templateEngine);
        break;
      case ServiceType.MINIO:
        service = new MinioService(config, this.templateEngine);
        break;
      case ServiceType.KAFKA:
        service = new KafkaService(config, this.templateEngine);
        break;
      case ServiceType.RABBITMQ:
        service = new RabbitMQService(config, this.templateEngine);
        break;
      case ServiceType.OLLAMA:
        service = new OllamaService(config, this.templateEngine);
        break;

      case ServiceType.N8N:
        service = new N8nService(config, this.templateEngine);
        break;
      case ServiceType.KESTRA:
        service = new KestraService(config, this.templateEngine);
        break;
      case ServiceType.KEYSTONEJS:
        service = new KeystoneJSService(config, this.templateEngine);
        break;
      case ServiceType.COCKPIT:
        service = new CockpitService(config, this.templateEngine);
        break;
      case ServiceType.AUTHELIA:
        service = new AutheliaService(config, this.templateEngine);
        break;
      case ServiceType.LOCALSTACK:
        service = new LocalStackService(config, this.templateEngine);
        break;
      case ServiceType.ONEDEV:
        service = new OneDevService(config, this.templateEngine);
        break;
      case ServiceType.SONARQUBE:
        service = new SonarQubeService(config, this.templateEngine);
        break;
      case ServiceType.TRIVY:
        service = new TrivyService(config, this.templateEngine);
        break;
      case ServiceType.RAPIDOC:
        service = new RapiDocService(config, this.templateEngine);
        break;
      case ServiceType.GRAFANA:
        service = new GrafanaService(config, this.templateEngine);
        break;
      case ServiceType.LOKI:
        service = new LokiService(config, this.templateEngine);
        break;
      case ServiceType.FLUENTBIT:
        service = new FluentBitService(config, this.templateEngine);
        break;
      case ServiceType.REGISTRY:
        service = new RegistryService(config, this.templateEngine);
        break;
      case ServiceType.NEXUS:
        service = new NexusService(config, this.templateEngine);
        break;
      case ServiceType.VAULT:
        service = new VaultService(config, this.templateEngine);
        break;
      case ServiceType.PSITRANSFER:
        service = new PsiTransferService(config, this.templateEngine);
        break;
      case ServiceType.EXCALIDRAW:
        service = new ExcalidrawService(config, this.templateEngine);
        break;
      case ServiceType.DRAWIO:
        service = new DrawIOService(config, this.templateEngine);
        break;
      case ServiceType.KROKI:
        service = new KrokiService(config, this.templateEngine);
        break;
      case ServiceType.OUTLINE:
        service = new OutlineService(config, this.templateEngine);
        break;
      case ServiceType.GRIST:
        service = new GristService(config, this.templateEngine);
        break;
      case ServiceType.NOCODB:
        service = new NocoDBService(config, this.templateEngine);
        break;
      case ServiceType.JASPERREPORTS:
        service = new JasperReportsService(config, this.templateEngine);
        break;
      case ServiceType.DOCUSEAL:
        service = new DocuSealService(config, this.templateEngine);
        break;
      case ServiceType.LIBRETRANSLATE:
        service = new LibreTranslateService(config, this.templateEngine);
        break;
      case ServiceType.MAILSERVER:
        service = new MailserverService(config, this.templateEngine);
        break;
      case ServiceType.FRP:
        service = new FrpService(config, this.templateEngine);
        break;
      default:
        throw new ServiceInstallationError(
          ServiceType.CADDY, // Generic error, Caddy is a core service
          `Unknown service type: ${serviceType}`
        );
    }

    // Cache the service instance
    this.serviceInstances.set(serviceType, service);
    return service;
  }

  /**
   * Create all services based on configuration
   * @param config HomeLab configuration
   * @returns Array of service instances
   */
  createServices(config: HomelabConfig): Service[] {
    const services: Service[] = [];

    // Always include core services
    const coreServices = this.getCoreServices();
    for (const serviceType of coreServices) {
      services.push(this.createService(serviceType, config));
    }

    // Add selected optional services
    for (const serviceType of config.selectedServices) {
      if (!coreServices.includes(serviceType)) {
        services.push(this.createService(serviceType, config));
      }
    }

    return services;
  }

  /**
   * Get installation order for services based on dependencies
   * @param services Array of services to order
   * @returns Array of services in installation order
   */
  getInstallationOrder(services: Service[]): Service[] {
    const ordered: Service[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (service: Service) => {
      if (visiting.has(service.name)) {
        throw new ServiceInstallationError(
          ServiceType.CADDY, // Generic error, Caddy is a core service
          `Circular dependency detected involving service: ${service.name}`
        );
      }

      if (visited.has(service.name)) {
        return;
      }

      visiting.add(service.name);

      // Process dependencies first
      for (const depName of service.dependencies) {
        const depService = services.find(s => s.name === depName);
        if (depService) {
          visit(depService);
        }
      }

      visiting.delete(service.name);
      visited.add(service.name);
      ordered.push(service);
    };

    // Core services should be installed first
    const coreServices = services.filter(s => s.isCore);
    const optionalServices = services.filter(s => !s.isCore);

    // Install core services first
    for (const service of coreServices) {
      visit(service);
    }

    // Then install optional services
    for (const service of optionalServices) {
      visit(service);
    }

    return ordered;
  }

  /**
   * Resolve dependencies for a service
   * @param serviceType Service type to resolve dependencies for
   * @param config HomeLab configuration
   * @returns Array of dependency service instances
   */
  resolveDependencies(serviceType: ServiceType, config: HomelabConfig): Service[] {
    const service = this.createService(serviceType, config);
    const dependencies: Service[] = [];

    for (const depName of service.dependencies) {
      // Find the service type that matches the dependency name
      const depServiceType = this.findServiceTypeByName(depName);
      if (depServiceType) {
        dependencies.push(this.createService(depServiceType, config));
      }
    }

    return dependencies;
  }

  /**
   * Get core services that are always installed
   * @returns Array of core service types
   */
  getCoreServices(): ServiceType[] {
    return [
      ServiceType.CADDY,
      ServiceType.PORTAINER,
      ServiceType.COPYPARTY,
      ServiceType.DUCKDB
    ];
  }

  /**
   * Get optional services that can be selected
   * @returns Array of optional service types
   */
  getOptionalServices(): ServiceType[] {
    return [
      ServiceType.POSTGRESQL,
      ServiceType.REDIS,
      ServiceType.MONGODB,
      ServiceType.MARIADB,
      ServiceType.MINIO,
      ServiceType.KAFKA,
      ServiceType.RABBITMQ,
      ServiceType.OLLAMA,
      ServiceType.N8N,
      ServiceType.KESTRA,
      ServiceType.KEYSTONEJS,
      ServiceType.COCKPIT,
      ServiceType.AUTHELIA,
      ServiceType.LOCALSTACK,
      ServiceType.ONEDEV,
      ServiceType.SONARQUBE,
      ServiceType.TRIVY,
      ServiceType.RAPIDOC,
      ServiceType.GRAFANA,
      ServiceType.LOKI,
      ServiceType.FLUENTBIT,
      ServiceType.REGISTRY,
      ServiceType.NEXUS,
      ServiceType.VAULT,
      ServiceType.PSITRANSFER,
      ServiceType.EXCALIDRAW,
      ServiceType.DRAWIO,
      ServiceType.KROKI,
      ServiceType.OUTLINE,
      ServiceType.GRIST,
      ServiceType.NOCODB,
      ServiceType.JASPERREPORTS,
      ServiceType.DOCUSEAL,
      ServiceType.LIBRETRANSLATE,
      ServiceType.MAILSERVER,
      ServiceType.FRP,
    ];
  }

  /**
   * Validate service configuration
   * @param config HomeLab configuration
   * @throws ServiceInstallationError if configuration is invalid
   */
  validateConfiguration(config: HomelabConfig): void {
    // Check if PostgreSQL, MariaDB, or MongoDB is selected but password is not provided
    if (config.selectedServices.includes(ServiceType.POSTGRESQL) || 
        config.selectedServices.includes(ServiceType.MARIADB) || 
        config.selectedServices.includes(ServiceType.MONGODB)) {
      if (!config.databasePassword || config.databasePassword.trim() === '') {
        throw new ServiceInstallationError(
          ServiceType.CADDY, // Use a generic service type for this combined error
          'Database service (PostgreSQL, MariaDB, or MongoDB) is selected but no database password is provided in configuration'
        );
      }
    }

    // Validate that all selected services are valid
    const allValidServices = [...this.getCoreServices(), ...this.getOptionalServices()];
    for (const serviceType of config.selectedServices) {
      if (!allValidServices.includes(serviceType)) {
        throw new ServiceInstallationError(
          ServiceType.CADDY, // Generic error, Caddy is a core service
          `Invalid service type in configuration: ${serviceType}`
        );
      }
    }
  }

  /**
   * Clear service instance cache
   */
  clearCache(): void {
    this.serviceInstances.clear();
  }

  /**
   * Get cached service instances
   */
  getCachedServices(): Map<ServiceType, Service> {
    return new Map(this.serviceInstances);
  }

  /**
   * Find service type by service name (for dependency resolution)
   * @param serviceName Name of the service
   * @returns ServiceType or undefined if not found
   */
  private findServiceTypeByName(serviceName: string): ServiceType | undefined {
    const serviceNameMap: Record<string, ServiceType> = {
      'Caddy': ServiceType.CADDY,
      'Portainer': ServiceType.PORTAINER,
      'Copyparty': ServiceType.COPYPARTY,
      'PostgreSQL': ServiceType.POSTGRESQL,
      'Redis': ServiceType.REDIS,
      'MongoDB': ServiceType.MONGODB,
      'MariaDB': ServiceType.MARIADB,
      'Minio': ServiceType.MINIO,
      'Kafka': ServiceType.KAFKA,
      'RabbitMQ': ServiceType.RABBITMQ,
      'Ollama': ServiceType.OLLAMA,
      'n8n': ServiceType.N8N,
      'Kestra': ServiceType.KESTRA,
      'KeystoneJS': ServiceType.KEYSTONEJS,
      'Authelia': ServiceType.AUTHELIA,
      'LocalStack': ServiceType.LOCALSTACK,
      'OneDev': ServiceType.ONEDEV,
      'SonarQube': ServiceType.SONARQUBE,
      'Trivy': ServiceType.TRIVY,
      'RapiDoc': ServiceType.RAPIDOC,
      'Grafana': ServiceType.GRAFANA,
      'Loki': ServiceType.LOKI,
      'Fluent Bit': ServiceType.FLUENTBIT,
      'Registry': ServiceType.REGISTRY,
      'Nexus Repository': ServiceType.NEXUS,
      'Vault': ServiceType.VAULT,
      'PsiTransfer': ServiceType.PSITRANSFER,
      'Excalidraw': ServiceType.EXCALIDRAW,
      'Draw.io': ServiceType.DRAWIO,
      'Kroki': ServiceType.KROKI,
      'Outline': ServiceType.OUTLINE,
      'Grist': ServiceType.GRIST,
      'NocoDB': ServiceType.NOCODB,
      'JasperReports Server': ServiceType.JASPERREPORTS,
      'DocuSeal': ServiceType.DOCUSEAL,
      'LibreTranslate': ServiceType.LIBRETRANSLATE,
      'Docker Mailserver': ServiceType.MAILSERVER,
      'FRP Client': ServiceType.FRP,
    };

    return serviceNameMap[serviceName];
  }
}