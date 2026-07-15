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
  ARCANE = 'arcane',
  COPYPARTY = 'copyparty',
  RUSTFS = 'rustfs',
  DUCKDB = 'duckdb',
  POSTGRESQL = 'postgresql',
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
  TINYAUTH = 'tinyauth',
  POCKETID = 'pocketid',
  APISIX = 'apisix',
  K3D = 'k3d',
  CODESERVER = 'codeserver',
  JUPYTERLAB = 'jupyterlab',
  FORGEJO = 'forgejo',
  ONEDEV = 'onedev',
  JENKINS = 'jenkins',
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
  PROMETHEUS = 'prometheus',
  FLUENTBIT = 'fluentbit',
  OPENSEARCH = 'opensearch',
  QDRANT = 'qdrant',
  COROOT = 'coroot',
  REDASH = 'redash',
  REGISTRY = 'registry',
  NEXUS = 'nexus',
  VAULT = 'vault',
  CONSUL = 'consul',
  VAULTWARDEN = 'vaultwarden',
  LINKWARDEN = 'linkwarden',
  SHLINK = 'shlink',
  PSITRANSFER = 'psitransfer',
  SEND = 'send',
  EXCALIDRAW = 'excalidraw',
  DRAWIO = 'drawio',
  WISEMAPPING = 'wisemapping',
  KROKI = 'kroki',
  PRESENTON = 'presenton',
  SLIDEV = 'slidev',
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
  NTFY = 'ntfy',
  MAILPIT = 'mailpit',
  MAILSERVER = 'mailserver',
  LISTMONK = 'listmonk',
  CLOUDFLARED = 'cloudflared',
  HEADSCALE = 'headscale',
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
  LIGHTRAG = 'lightrag',
  VOICEBOX = 'voicebox',
  COPILOTKIT = 'copilotkit',
  GOOSE = 'goose',
  HERMES = 'hermes',
  OPENCLAW = 'openclaw',
  FIRECRAWL = 'firecrawl',
  SEARXNG = 'searxng',
  PLAUSIBLE = 'plausible',
  DIRECTUS = 'directus',
  INSFORGE = 'insforge',
  SPARK = 'spark',
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
  tunnelDomain?: string;
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
