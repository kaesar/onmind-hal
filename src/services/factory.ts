import { Service, ServiceType, HomelabConfig } from '../core/types.js';
import { ServiceInstallationError } from '../utils/errors.js';
import { TemplateEngine } from '../templates/engine.js';

// Core services
import { CaddyService } from './core/caddy.js';
import { DockhandService } from './core/dockhand.js';
import { ArcaneService } from './optional/arcane.js';
import { CopypartyService } from './core/copyparty.js';

// Optional services
import { DuckDBService } from './optional/duckdb.js';
import { PostgreSQLService } from './optional/postgresql.js';
import { RedisService } from './optional/redis.js';
import { MongoDBService } from './optional/mongodb.js';
import { MariaDBService } from './optional/mariadb.js';
import { ScyllaDBService } from './optional/scylladb.js';
import { KafkaService } from './optional/kafka.js';
import { KafkauiService } from './optional/kafkaui.js';
import { RabbitMQService } from './optional/rabbitmq.js';
import { OllamaService } from './optional/ollama.js';
import { OpenWebUIService } from './optional/openwebui.js';
import { OpenNotebookLMService } from './optional/opennotebooklm.js';
import { N8nService } from './optional/n8n.js';
import { TooljetService } from './optional/tooljet.js';
import { KestraService } from './optional/kestra.js';
import { KeystoneJSService } from './optional/keystonejs.js';
import { KeycloakService } from './optional/keycloak.js';
import { AutheliaService } from './optional/authelia.js';
import { PocketIDService } from './optional/pocketid.js';
import { ApisixService } from './optional/apisix.js';
import { K3dService } from './optional/k3d.js';
import { CodeServerService } from './optional/codeserver.js';
import { JupyterLabService } from './optional/jupyterlab.js';
import { ForgejoService } from './optional/forgejo.js';
import { OneDevService } from './optional/onedev.js';
import { JenkinsService } from './optional/jenkins.js';
import { SemaphoreService } from './optional/semaphore.js';
import { BackstageService } from './optional/backstage.js';
import { LiquibaseService } from './optional/liquibase.js';
import { SonarQubeService } from './optional/sonarqube.js';
import { TrivyService } from './optional/trivy.js';
import { KarateService } from './optional/karate.js';
import { RapiDocService } from './optional/rapidoc.js';
import { HoppscotchService } from './optional/hoppscotch.js';
import { K6Service } from './optional/k6.js';
import { GrafanaService } from './optional/grafana.js';
import { LokiService } from './optional/loki.js';
import { PrometheusService } from './optional/prometheus.js';
import { FluentBitService } from './optional/fluentbit.js';
import { OpenSearchService } from './optional/opensearch.js';
import { QdrantService } from './optional/qdrant.js';
import { CorootService } from './optional/coroot.js';
import { RedashService } from './optional/redash.js';
import { RegistryService } from './optional/registry.js';
import { NexusService } from './optional/nexus.js';
import { VaultService } from './optional/vault.js';
import { ConsulService } from './optional/consul.js';
import { VaultwardenService } from './optional/vaultwarden.js';
import { LinkwardenService } from './optional/linkwarden.js';
import { ShlinkService } from './optional/shlink.js';
import { PsiTransferService } from './optional/psitransfer.js';
import { SendService } from './optional/send.js';
import { FilestashService } from './optional/filestash.js';
import { SeafileService } from './optional/seafile.js';
import { ExcalidrawService } from './optional/excalidraw.js';
import { DrawIOService } from './optional/drawio.js';
import { WiseMappingService } from './optional/wisemapping.js';
import { KrokiService } from './optional/kroki.js';
import { PresentonService } from './optional/presenton.js';
import { SlidevService } from './optional/slidev.js';
import { OutlineService } from './optional/outline.js';
import { GristService } from './optional/grist.js';
import { NocoDBService } from './optional/nocodb.js';
import { TwentyCRMService } from './optional/twentycrm.js';
import { ChatwootService } from './optional/chatwoot.js';
import { MedusaJSService } from './optional/medusajs.js';
import { MattermostService } from './optional/mattermost.js';
import { CalcomService } from './optional/calcom.js';
import { AdGuardService } from './optional/adguard.js';
import { JasperReportsService } from './optional/jasperreports.js';
import { DocuSealService } from './optional/docuseal.js';
import { StirlingPDFService } from './optional/stirlingpdf.js';
import { PandocWebService } from './optional/pandocweb.js';
import { CalibreWebService } from './optional/calibreweb.js';
import { ImmichService } from './optional/immich.js';
import { LibreTranslateService } from './optional/libretranslate.js';
import { NtfyService } from './optional/ntfy.js';
import { MailpitService } from './optional/mailpit.js';
import { MailserverService } from './optional/mailserver.js';
import { ListmonkService } from './optional/listmonk.js';
import { CloudflaredService } from './optional/cloudflared.js';
import { WettyService } from './optional/wetty.js';
import { UptimeKumaService } from './optional/uptimekuma.js';
import { DozzleService } from './optional/dozzle.js';
import { HulyService } from './optional/huly.js';
import { RustFSService } from './optional/rustfs.js';
import { InfisicalService } from './optional/infisical.js';
import { FlociService } from './optional/floci.js';
import { FlociAZService } from './optional/flociaz.js';
import { FlociGCPService } from './optional/flocigcp.js';
import { LiteLLMService } from './optional/litellm.js';
import { AnythingLLMService } from './optional/anythingllm.js';
import { LightRAGService } from './optional/lightrag.js';
import { VoiceboxService } from './optional/voicebox.js';
import { CopilotKitService } from './optional/copilotkit.js';
import { OpenClawService } from './optional/openclaw.js';
import { GooseService } from './optional/goose.js';
import { HermesService } from './optional/hermes.js';
import { FirecrawlService } from './optional/firecrawl.js';
import { SearXNGService } from './optional/searxng.js';
import { PlausibleService } from './optional/plausible.js';
import { DirectusService } from './optional/directus.js';
import { InsForgeService } from './optional/insforge.js';
import { SparkService } from './optional/spark.js';
import { HeadscaleService } from './optional/headscale.js';
import { RustDeskService } from './optional/rustdesk.js';

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
      case ServiceType.DOCKHAND:
        service = new DockhandService(config, this.templateEngine);
        break;
      case ServiceType.ARCANE:
        service = new ArcaneService(config, this.templateEngine);
        break;
      case ServiceType.COPYPARTY:
        service = new CopypartyService(config, this.templateEngine);
        break;
      case ServiceType.RUSTFS:
        service = new RustFSService(config, this.templateEngine);
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
      case ServiceType.SCYLLADB:
        service = new ScyllaDBService(config, this.templateEngine);
        break;
      case ServiceType.KAFKA:
        service = new KafkaService(config, this.templateEngine);
        break;
      case ServiceType.KAFKAUI:
        service = new KafkauiService(config, this.templateEngine);
        break;
      case ServiceType.RABBITMQ:
        service = new RabbitMQService(config, this.templateEngine);
        break;
      case ServiceType.OLLAMA:
        service = new OllamaService(config, this.templateEngine);
        break;
      case ServiceType.OPENWEBUI:
        service = new OpenWebUIService(config, this.templateEngine);
        break;
      case ServiceType.OPENNOTEBOOKLM:
        service = new OpenNotebookLMService(config, this.templateEngine);
        break;
      case ServiceType.N8N:
        service = new N8nService(config, this.templateEngine);
        break;
      case ServiceType.TOOLJET:
        service = new TooljetService(config, this.templateEngine);
        break;
      case ServiceType.KESTRA:
        service = new KestraService(config, this.templateEngine);
        break;
      case ServiceType.KEYSTONEJS:
        service = new KeystoneJSService(config, this.templateEngine);
        break;
      case ServiceType.KEYCLOAK:
        service = new KeycloakService(config, this.templateEngine);
        break;
      case ServiceType.AUTHELIA:
        service = new AutheliaService(config, this.templateEngine);
        break;
      case ServiceType.POCKETID:
        service = new PocketIDService(config, this.templateEngine);
        break;
      case ServiceType.APISIX:
        service = new ApisixService(config, this.templateEngine);
        break;
      case ServiceType.K3D:
        service = new K3dService(config, this.templateEngine);
        break;
      case ServiceType.CODESERVER:
        service = new CodeServerService(config, this.templateEngine);
        break;
      case ServiceType.JUPYTERLAB:
        service = new JupyterLabService(config, this.templateEngine);
        break;
      case ServiceType.FORGEJO:
        service = new ForgejoService(config, this.templateEngine);
        break;
      case ServiceType.ONEDEV:
        service = new OneDevService(config, this.templateEngine);
        break;
      case ServiceType.JENKINS:
        service = new JenkinsService(config, this.templateEngine);
        break;
      case ServiceType.SEMAPHORE:
        service = new SemaphoreService(config, this.templateEngine);
        break;
      case ServiceType.BACKSTAGE:
        service = new BackstageService(config, this.templateEngine);
        break;
      case ServiceType.LIQUIBASE:
        service = new LiquibaseService(config, this.templateEngine);
        break;
      case ServiceType.SONARQUBE:
        service = new SonarQubeService(config, this.templateEngine);
        break;
      case ServiceType.TRIVY:
        service = new TrivyService(config, this.templateEngine);
        break;
      case ServiceType.KARATE:
        service = new KarateService(config, this.templateEngine);
        break;
      case ServiceType.RAPIDOC:
        service = new RapiDocService(config, this.templateEngine);
        break;
      case ServiceType.HOPPSCOTCH:
        service = new HoppscotchService(config, this.templateEngine);
        break;
      case ServiceType.K6:
        service = new K6Service(config, this.templateEngine);
        break;
      case ServiceType.GRAFANA:
        service = new GrafanaService(config, this.templateEngine);
        break;
      case ServiceType.LOKI:
        service = new LokiService(config, this.templateEngine);
        break;
      case ServiceType.PROMETHEUS:
        service = new PrometheusService(config, this.templateEngine);
        break;
      case ServiceType.FLUENTBIT:
        service = new FluentBitService(config, this.templateEngine);
        break;
      case ServiceType.OPENSEARCH:
        service = new OpenSearchService(config, this.templateEngine);
        break;
      case ServiceType.QDRANT:
        service = new QdrantService(config, this.templateEngine);
        break;
      case ServiceType.COROOT:
        service = new CorootService(config, this.templateEngine);
        break;
      case ServiceType.REDASH:
        service = new RedashService(config, this.templateEngine);
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
      case ServiceType.CONSUL:
        service = new ConsulService(config, this.templateEngine);
        break;
      case ServiceType.VAULTWARDEN:
        service = new VaultwardenService(config, this.templateEngine);
        break;
      case ServiceType.LINKWARDEN:
        service = new LinkwardenService(config, this.templateEngine);
        break;
      case ServiceType.SHLINK:
        service = new ShlinkService(config, this.templateEngine);
        break;
      case ServiceType.PSITRANSFER:
        service = new PsiTransferService(config, this.templateEngine);
        break;
      case ServiceType.SEND:
        service = new SendService(config, this.templateEngine);
        break;
      case ServiceType.FILESTASH:
        service = new FilestashService(config, this.templateEngine);
        break;
      case ServiceType.SEAFILE:
        service = new SeafileService(config, this.templateEngine);
        break;
      case ServiceType.EXCALIDRAW:
        service = new ExcalidrawService(config, this.templateEngine);
        break;
      case ServiceType.DRAWIO:
        service = new DrawIOService(config, this.templateEngine);
        break;
      case ServiceType.WISEMAPPING:
        service = new WiseMappingService(config, this.templateEngine);
        break;
      case ServiceType.KROKI:
        service = new KrokiService(config, this.templateEngine);
        break;
      case ServiceType.PRESENTON:
        service = new PresentonService(config, this.templateEngine);
        break;
      case ServiceType.SLIDEV:
        service = new SlidevService(config, this.templateEngine);
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
      case ServiceType.TWENTYCRM:
        service = new TwentyCRMService(config, this.templateEngine);
        break;
      case ServiceType.CHATWOOT:
        service = new ChatwootService(config, this.templateEngine);
        break;
      case ServiceType.MEDUSAJS:
        service = new MedusaJSService(config, this.templateEngine);
        break;
      case ServiceType.MATTERMOST:
        service = new MattermostService(config, this.templateEngine);
        break;
      case ServiceType.CALCOM:
        service = new CalcomService(config, this.templateEngine);
        break;
      case ServiceType.ADGUARD:
        service = new AdGuardService(config, this.templateEngine);
        break;
      case ServiceType.JASPERREPORTS:
        service = new JasperReportsService(config, this.templateEngine);
        break;
      case ServiceType.DOCUSEAL:
        service = new DocuSealService(config, this.templateEngine);
        break;
      case ServiceType.STIRLINGPDF:
        service = new StirlingPDFService(config, this.templateEngine);
        break;
      case ServiceType.PANDOCWEB:
        service = new PandocWebService(config, this.templateEngine);
        break;
      case ServiceType.CALIBREWEB:
        service = new CalibreWebService(config, this.templateEngine);
        break;
      case ServiceType.IMMICH:
        service = new ImmichService(config, this.templateEngine);
        break;
      case ServiceType.LIBRETRANSLATE:
        service = new LibreTranslateService(config, this.templateEngine);
        break;
      case ServiceType.NTFY:
        service = new NtfyService(config, this.templateEngine);
        break;
      case ServiceType.MAILPIT:
        service = new MailpitService(config, this.templateEngine);
        break;
      case ServiceType.MAILSERVER:
        service = new MailserverService(config, this.templateEngine);
        break;
      case ServiceType.LISTMONK:
        service = new ListmonkService(config, this.templateEngine);
        break;
      case ServiceType.CLOUDFLARED:
        service = new CloudflaredService(config, this.templateEngine);
        break;
      case ServiceType.WETTY:
        service = new WettyService(config, this.templateEngine);
        break;
      case ServiceType.UPTIMEKUMA:
        service = new UptimeKumaService(config, this.templateEngine);
        break;
      case ServiceType.DOZZLE:
        service = new DozzleService(config, this.templateEngine);
        break;
      case ServiceType.HULY:
        service = new HulyService(config, this.templateEngine);
        break;
      case ServiceType.INFISCAL:
        service = new InfisicalService(config, this.templateEngine);
        break;
      case ServiceType.FLOCI:
        service = new FlociService(config, this.templateEngine);
        break;
      case ServiceType.FLOCIAZ:
        service = new FlociAZService(config, this.templateEngine);
        break;
      case ServiceType.FLOCIGCP:
        service = new FlociGCPService(config, this.templateEngine);
        break;
      case ServiceType.LITELLM:
        service = new LiteLLMService(config, this.templateEngine);
        break;
      case ServiceType.ANYTHINGLLM:
        service = new AnythingLLMService(config, this.templateEngine);
        break;
      case ServiceType.LIGHTRAG:
        service = new LightRAGService(config, this.templateEngine);
        break;
      case ServiceType.VOICEBOX:
        service = new VoiceboxService(config, this.templateEngine);
        break;
      case ServiceType.COPILOTKIT:
        service = new CopilotKitService(config, this.templateEngine);
        break;
      case ServiceType.GOOSE:
        service = new GooseService(config, this.templateEngine);
        break;
      case ServiceType.HERMES:
        service = new HermesService(config, this.templateEngine);
        break;
      case ServiceType.OPENCLAW:
        service = new OpenClawService(config, this.templateEngine);
        break;
      case ServiceType.FIRECRAWL:
        service = new FirecrawlService(config, this.templateEngine);
        break;
      case ServiceType.SEARXNG:
        service = new SearXNGService(config, this.templateEngine);
        break;
      case ServiceType.PLAUSIBLE:
        service = new PlausibleService(config, this.templateEngine);
        break;
      case ServiceType.DIRECTUS:
        service = new DirectusService(config, this.templateEngine);
        break;
      case ServiceType.INSFORGE:
        service = new InsForgeService(config, this.templateEngine);
        break;
      case ServiceType.SPARK:
        service = new SparkService(config, this.templateEngine);
        break;
      case ServiceType.HEADSCALE:
        service = new HeadscaleService(config, this.templateEngine);
        break;
      case ServiceType.RUSTDESK:
        service = new RustDeskService(config, this.templateEngine);
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
      ServiceType.COPYPARTY
    ];
  }

  /**
   * Get optional services that can be selected
   * @returns Array of optional service types
   */
  getOptionalServices(): ServiceType[] {
    return [
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
      ServiceType.JENKINS,
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
      ServiceType.LIGHTRAG,
      ServiceType.VOICEBOX,
      ServiceType.COPILOTKIT,
      ServiceType.GOOSE,
      ServiceType.HERMES,
      ServiceType.OPENCLAW,
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
      ServiceType.NTFY,
      ServiceType.MAILPIT,
      ServiceType.MAILSERVER,
      ServiceType.LISTMONK,
      ServiceType.CLOUDFLARED,
      ServiceType.HEADSCALE,
      ServiceType.WETTY,
      ServiceType.RUSTDESK,
      ServiceType.ARCANE,
    ];
  }

  /**
   * Validate service configuration
   * @param config HomeLab configuration
   * @throws ServiceInstallationError if configuration is invalid
   */
  validateConfiguration(config: HomelabConfig): void {
    // Check if PostgreSQL, MariaDB, MongoDB, or OpenSearch is selected but password is not provided
    if (config.selectedServices.includes(ServiceType.POSTGRESQL) || 
        config.selectedServices.includes(ServiceType.MARIADB) || 
        config.selectedServices.includes(ServiceType.MONGODB) ||
        config.selectedServices.includes(ServiceType.OPENSEARCH)) {
      if (!config.storagePassword || config.storagePassword.trim() === '') {
        throw new ServiceInstallationError(
          ServiceType.CADDY, // Use a generic service type for this combined error
          'Database service (PostgreSQL, MariaDB, MongoDB, or OpenSearch) is selected but no database password is provided in configuration'
        );
      }
    }

    // Validate that all selected services are valid
    const allValidServices = [...this.getCoreServices(), ...this.getOptionalServices()];
    const deprecatedServices = [ServiceType.PSITRANSFER, ServiceType.PORTAINER]; // Deprecated services
    const invalidServices = config.selectedServices.filter(
      s => !allValidServices.includes(s) && !deprecatedServices.includes(s)
    );
    if (invalidServices.length > 0) {
      throw new ServiceInstallationError(
        ServiceType.CADDY,
        `Invalid service types in configuration: ${invalidServices.join(', ')}`
      );
    }
    // Remove deprecated services without mutating during iteration
    config.selectedServices = config.selectedServices.filter(
      s => allValidServices.includes(s)
    );
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
      'ScyllaDB': ServiceType.SCYLLADB,
      'Kafka': ServiceType.KAFKA,
      'Kafka UI': ServiceType.KAFKAUI,
      'RabbitMQ': ServiceType.RABBITMQ,
      'Ollama': ServiceType.OLLAMA,
      'Open WebUI': ServiceType.OPENWEBUI,
      'Open NotebookLM': ServiceType.OPENNOTEBOOKLM,
      'n8n': ServiceType.N8N,
      'ToolJet': ServiceType.TOOLJET,
      'Kestra': ServiceType.KESTRA,
      'KeystoneJS': ServiceType.KEYSTONEJS,
      'Keycloak': ServiceType.KEYCLOAK,
      'Authelia': ServiceType.AUTHELIA,
      'PocketID': ServiceType.POCKETID,
      'Apache APISIX': ServiceType.APISIX,
      'k3d': ServiceType.K3D,
      'Code Server': ServiceType.CODESERVER,
      'JupyterLab': ServiceType.JUPYTERLAB,
      'Forgejo': ServiceType.FORGEJO,
      'OneDev': ServiceType.ONEDEV,
      'Jenkins': ServiceType.JENKINS,
      'Semaphore UI': ServiceType.SEMAPHORE,
      'Backstage': ServiceType.BACKSTAGE,
      'Liquibase': ServiceType.LIQUIBASE,
      'SonarQube': ServiceType.SONARQUBE,
      'Trivy': ServiceType.TRIVY,
      'Karate': ServiceType.KARATE,
      'RapiDoc': ServiceType.RAPIDOC,
      'Hoppscotch': ServiceType.HOPPSCOTCH,
      'K6': ServiceType.K6,
      'Grafana': ServiceType.GRAFANA,
      'Loki': ServiceType.LOKI,
      'Prometheus': ServiceType.PROMETHEUS,
      'Fluent Bit': ServiceType.FLUENTBIT,
      'Coroot': ServiceType.COROOT,
      'ReDash': ServiceType.REDASH,
      'Registry': ServiceType.REGISTRY,
      'Nexus Repository': ServiceType.NEXUS,
      'Vault': ServiceType.VAULT,
      'Consul': ServiceType.CONSUL,
      'Vaultwarden': ServiceType.VAULTWARDEN,
      'Linkwarden': ServiceType.LINKWARDEN,
      'Shlink': ServiceType.SHLINK,
      'Send': ServiceType.SEND,
      'Filestash': ServiceType.FILESTASH,
      'Seafile': ServiceType.SEAFILE,
      'Excalidraw': ServiceType.EXCALIDRAW,
      'Draw.io': ServiceType.DRAWIO,
      'WiseMapping': ServiceType.WISEMAPPING,
      'Kroki': ServiceType.KROKI,
      'Presenton': ServiceType.PRESENTON,
      'Slidev': ServiceType.SLIDEV,
      'Outline': ServiceType.OUTLINE,
      'Grist': ServiceType.GRIST,
      'NocoDB': ServiceType.NOCODB,
      'TwentyCRM': ServiceType.TWENTYCRM,
      'Chatwoot': ServiceType.CHATWOOT,
      'MedusaJS': ServiceType.MEDUSAJS,
      'Mattermost': ServiceType.MATTERMOST,
      'Cal.com': ServiceType.CALCOM,
      'AdGuard Home': ServiceType.ADGUARD,
      'JasperReports Server': ServiceType.JASPERREPORTS,
      'DocuSeal': ServiceType.DOCUSEAL,
      'Stirling-PDF': ServiceType.STIRLINGPDF,
      'Pandoc-Web': ServiceType.PANDOCWEB,
      'Calibre Web': ServiceType.CALIBREWEB,
      'Immich': ServiceType.IMMICH,
      'LibreTranslate': ServiceType.LIBRETRANSLATE,
      'Directus': ServiceType.DIRECTUS,
      'InsForge': ServiceType.INSFORGE,
      'Apache Spark': ServiceType.SPARK,
      'Ntfy': ServiceType.NTFY,
      'Mailpit': ServiceType.MAILPIT,
      'Docker Mailserver': ServiceType.MAILSERVER,
      'Listmonk': ServiceType.LISTMONK,
      'Cloudflare Tunnel': ServiceType.CLOUDFLARED,
      'Headscale': ServiceType.HEADSCALE,
      'Wetty': ServiceType.WETTY,
      'Uptime Kuma': ServiceType.UPTIMEKUMA,
      'Dozzle': ServiceType.DOZZLE,
      'Huly': ServiceType.HULY,
      'RustFS': ServiceType.RUSTFS,
      'Infisical': ServiceType.INFISCAL,
      'Floci': ServiceType.FLOCI,
      'Floci-AZ': ServiceType.FLOCIAZ,
      'Floci-GCP': ServiceType.FLOCIGCP,
      'LiteLLM': ServiceType.LITELLM,
      'AnythingLLM': ServiceType.ANYTHINGLLM,
      'LightRAG': ServiceType.LIGHTRAG,
      'Voicebox': ServiceType.VOICEBOX,
      'CopilotKit': ServiceType.COPILOTKIT,
      'Goose': ServiceType.GOOSE,
      'Hermes': ServiceType.HERMES,
      'OpenClaw': ServiceType.OPENCLAW,
      'OpenSearch': ServiceType.OPENSEARCH,
      'Qdrant': ServiceType.QDRANT,
      'Firecrawl': ServiceType.FIRECRAWL,
      'SearXNG': ServiceType.SEARXNG,
      'Plausible': ServiceType.PLAUSIBLE,
      'Dockhand': ServiceType.DOCKHAND,
      'RustDesk': ServiceType.RUSTDESK,
      'Portainer': ServiceType.PORTAINER,
    };

    return serviceNameMap[serviceName];
  }
}