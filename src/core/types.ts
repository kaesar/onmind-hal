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
  KAFKA = 'kafka',
  KAFKAUI = 'kafkaui',
  RABBITMQ = 'rabbitmq',
  OLLAMA = 'ollama',
  OPENWEBUI = 'openwebui',
  OPENNOTEBOOKLM = 'opennotebooklm',
  N8N = 'n8n',
  TOOLJET = 'tooljet',
  KESTRA = 'kestra',
  KEYSTONEJS = 'keystonejs',
  KEYCLOAK = 'keycloak',
  AUTHELIA = 'authelia',
  POCKETID = 'pocketid',
  APISIX = 'apisix',
  K3D = 'k3d',
  CODESERVER = 'codeserver',
  JUPYTERLAB = 'jupyterlab',
  ONEDEV = 'onedev',
  SEMAPHORE = 'semaphore',
  LIQUIBASE = 'liquibase',
  SONARQUBE = 'sonarqube',
  TRIVY = 'trivy',
  KARATE = 'karate',
  RAPIDOC = 'rapidoc',
  HOPPSCOTCH = 'hoppscotch',
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
  LINKWARDEN = 'linkwarden',
  SHLINK = 'shlink',
  PSITRANSFER = 'psitransfer',
  EXCALIDRAW = 'excalidraw',
  DRAWIO = 'drawio',
  WISEMAPPING = 'wisemapping',
  KROKI = 'kroki',
  OUTLINE = 'outline',
  GRIST = 'grist',
  NOCODB = 'nocodb',
  TWENTYCRM = 'twentycrm',
  CHATWOOT = 'chatwoot',
  MEDUSAJS = 'medusajs',
  MATTERMOST = 'mattermost',
  CALCOM = 'calcom',
  ADGUARD = 'adguard',
  JASPERREPORTS = 'jasperreports',
  DOCUSEAL = 'docuseal',
  STIRLINGPDF = 'stirlingpdf',
  PANDOCWEB = 'pandocweb',
  CALIBREWEB = 'calibreweb',
  IMMICH = 'immich',
  LIBRETRANSLATE = 'libretranslate',
  MAILSERVER = 'mailserver',
  LISTMONK = 'listmonk',
  ZROK = 'zrok',
  CLOUDFLARED = 'cloudflared',
  WETTY = 'wetty',
  UPTIMEKUMA = 'uptimekuma',
  DOZZLE = 'dozzle',
  HULY = 'huly',
  INFISCAL = 'infisical',
  FLOCI = 'floci',
  FLOCIAZ = 'flociaz',
  FLOCIGCP = 'flocigcp',
  LITELLM = 'litellm',
  ANYTHINGLLM = 'anythingllm',
  COPILOTKIT = 'copilotkit',
  GOOSE = 'goose',
  HERMES = 'hermes',
  OPENCLAW = 'openclaw',
  OPENHUMAN = 'openhuman',
  FIRECRAWL = 'firecrawl',
  SEARXNG = 'searxng',
  PLAUSIBLE = 'plausible',
  DIRECTUS = 'directus',
  INSFORGE = 'insforge',
  ORCAROUTERLITE = 'orcarouterlite',
  FILESTASH = 'filestash',
  SEAFILE = 'seafile',
  RUSTDESK = 'rustdesk',
  BACKSTAGE = 'backstage',
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
    postRun?: string[];
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
