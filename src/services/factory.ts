import { Service, ServiceType, HomelabConfig } from '../core/types.js';
import { ServiceInstallationError } from '../utils/errors.js';
import { TemplateEngine } from '../templates/engine.js';

// Core services
import { CaddyService } from './core/caddy.js';
import { PortainerService } from './core/portainer.js';
import { CopypartyService } from './core/copyparty.js';

// Optional services
import { N8nService } from './optional/n8n.js';
import { PostgreSQLService } from './optional/postgresql.js';
import { RedisService } from './optional/redis.js';
import { MongoDBService } from './optional/mongodb.js';
import { MinioService } from './optional/minio.js';
import { OllamaService } from './optional/ollama.js';

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
      case ServiceType.N8N:
        service = new N8nService(config, this.templateEngine);
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
      case ServiceType.MINIO:
        service = new MinioService(config, this.templateEngine);
        break;
      case ServiceType.OLLAMA:
        service = new OllamaService(config, this.templateEngine);
        break;
      default:
        throw new ServiceInstallationError(
          'ServiceFactory',
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
          'ServiceFactory',
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
      ServiceType.COPYPARTY
    ];
  }

  /**
   * Get optional services that can be selected
   * @returns Array of optional service types
   */
  getOptionalServices(): ServiceType[] {
    return [
      ServiceType.N8N,
      ServiceType.POSTGRESQL,
      ServiceType.REDIS,
      ServiceType.MONGODB,
      ServiceType.MINIO,
      ServiceType.OLLAMA
    ];
  }

  /**
   * Validate service configuration
   * @param config HomeLab configuration
   * @throws ServiceInstallationError if configuration is invalid
   */
  validateConfiguration(config: HomelabConfig): void {
    // Check if PostgreSQL is selected but password is not provided
    if (config.selectedServices.includes(ServiceType.POSTGRESQL)) {
      if (!config.postgresPassword || config.postgresPassword.trim() === '') {
        throw new ServiceInstallationError(
          'ServiceFactory',
          'PostgreSQL is selected but no password is provided in configuration'
        );
      }
    }

    // Validate that all selected services are valid
    const allValidServices = [...this.getCoreServices(), ...this.getOptionalServices()];
    for (const serviceType of config.selectedServices) {
      if (!allValidServices.includes(serviceType)) {
        throw new ServiceInstallationError(
          'ServiceFactory',
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
      'n8n': ServiceType.N8N,
      'PostgreSQL': ServiceType.POSTGRESQL,
      'Redis': ServiceType.REDIS,
      'MongoDB': ServiceType.MONGODB,
      'Minio': ServiceType.MINIO,
      'Ollama': ServiceType.OLLAMA
    };

    return serviceNameMap[serviceName];
  }
}