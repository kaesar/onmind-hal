/**
 * Core TypeScript interfaces and types for HomeLab application
 */

// Distribution types
export enum DistributionType {
  UBUNTU = 'ubuntu',
  ARCH = 'arch',
  AMAZON_LINUX = 'amazon',
  MACOS = 'macos',
  MINGW = 'mingw',
}

// Container runtime types for macOS
export enum ContainerRuntime {
  DOCKER = 'docker',
  COLIMA = 'colima',
  PODMAN = 'podman',
}

// Service types
export enum ServiceType {
  CADDY = 'caddy',
  DOCKHAND = 'dockhand',
  PORTAINER = 'portainer',
  COPYPARTY = 'copyparty',
  RUSTFS = 'rustfs',
  DUCKDB = 'duckdb',
  POSTGRESQL = 'postgresql', // (alternative to Oracle DB)
  REDIS = 'redis',
  MONGODB = 'mongodb',
  MARIADB = 'mariadb',
  SCYLLADB = 'scylladb',
  IGNITE = 'ignite',
  KAFKA = 'kafka',
  KAFKAUI = 'kafkaui',
  RABBITMQ = 'rabbitmq',
  OLLAMA = 'ollama',
  OPENWEBUI = 'openwebui',
  OPENNOTEBOOKLM = 'opennotebooklm',
  N8N = 'n8n',
  KESTRA = 'kestra',
  KEYSTONEJS = 'keystonejs',
  KEYCLOAK = 'keycloak',
  AUTHELIA = 'authelia',
  POCKETID = 'pocketid',
  APISIX = 'apisix',
  LOCALSTACK = 'localstack',
  K3D = 'k3d',
  ONEDEV = 'onedev',
  SEMAPHORE = 'semaphore',
  LIQUIBASE = 'liquibase',
  SONARQUBE = 'sonarqube',
  TRIVY = 'trivy',
  RAPIDOC = 'rapidoc',
  HOPPSCOTCH = 'hoppscotch',
  LOCUST = 'locust',
  K6 = 'k6',
  GRAFANA = 'grafana',
  LOKI = 'loki',
  OPENSEARCH = 'opensearch',
  COROOT = 'coroot',
  REDASH = 'redash',
  FLUENTBIT = 'fluentbit',
  REGISTRY = 'registry',
  NEXUS = 'nexus',
  VAULT = 'vault',
  CONSUL = 'consul',
  VAULTWARDEN = 'vaultwarden',
  BACKVAULT = 'backvault',
  LINKWARDEN = 'linkwarden',
  PSITRANSFER = 'psitransfer',
  EXCALIDRAW = 'excalidraw',
  DRAWIO = 'drawio',
  WISEMAPPING = 'wisemapping',
  KROKI = 'kroki',
  OUTLINE = 'outline',
  GRIST = 'grist',
  NOCODB = 'nocodb',
  TWENTYCRM = 'twentycrm',
  MEDUSAJS = 'medusajs',
  MATTERMOST = 'mattermost',
  CALCOM = 'calcom',
  JASPERREPORTS = 'jasperreports',
  STIRLINGPDF = 'stirlingpdf',
  LIBRETRANSLATE = 'libretranslate',
  MAILSERVER = 'mailserver',
  KURRIER = 'kurrier',
  ZROK = 'zrok',
  CLOUDFLARED = 'cloudflared',
  WETTY = 'wetty',
  UPTIMEKUMA = 'uptimekuma',
  DOZZLE = 'dozzle',
  HULY = 'huly',
  INFISCAL = 'infisical',
  FLOCI = 'floci',
  LITELLM = 'litellm',
  ANYTHINGLLM = 'anythingllm',
  HERMES = 'hermes',
  OPENCLAW = 'openclaw',
  OPENHUMAN = 'openhuman',
  OPENJARVIS = 'openjarvis',
  FIRECRAWL = 'firecrawl',
  SEARXNG = 'searxng',
  DIRECTUS = 'directus',
  ORCAROUTERLITE = 'orcarouterlite',
  FILESTASH = 'filestash',
  RUSTDESK = 'rustdesk',
}

// Configuration interface
export interface HomelabConfig {
  ip: string;
  domain: string;
  networkName: string;
  storagePassword?: string;
  selectedServices: ServiceType[];
  distribution: DistributionType;
  containerRuntime?: ContainerRuntime; // For macOS
  configPath: string;
  dataPath: string;
}

// Service selection interface
export interface ServiceSelection {
  core: ServiceType[];
  optional: ServiceType[];
}

// Service interface
export interface Service {
  name: string;
  type: ServiceType;
  isCore: boolean;
  dependencies: string[];
  install(): Promise<void>;
  configure(): Promise<void>;
  getAccessUrl(): string;
}

// Distribution strategy interface
export interface DistributionStrategy {
  name: string;
  detectDistribution(): Promise<boolean>;
  installDocker(): Promise<void>;
  installPackages(packages: string[]): Promise<void>;
  configureFirewall(): Promise<void>;
  configureDnsmasq?(
    domain: string,
    ip: string,
    services: string[],
  ): Promise<void>;
  getPackageManager(): string;
}

// Template interfaces
export interface Template {
  name: string;
  content: string;
  variables: Record<string, any>;
  render(context: Record<string, any>): string;
}

export interface DockerTemplate {
  commands: {
    install: string[];
    setup: string[];
    run: string;
  };
  variables: string[];
  dependencies?: string[];
}

export interface ConfigTemplate {
  filename: string;
  content: string;
  variables: string[];
}

// Error types are now defined in src/utils/errors.ts
