/**
 * Core TypeScript interfaces and types for HomeLab application
 */

// Distribution types
export enum DistributionType {
  UBUNTU = 'ubuntu',
  ARCH = 'arch',
  AMAZON_LINUX = 'amazon'
}

// Service types
export enum ServiceType {
  CADDY = 'caddy',
  PORTAINER = 'portainer',
  COPYPARTY = 'copyparty',
  POSTGRESQL = 'postgresql', // (alternative to Oracle DB)
  REDIS = 'redis',
  MONGODB = 'mongodb',
  MARIADB = 'mariadb',
  MINIO = 'minio',
  KAFKA = 'kafka',
  RABBITMQ = 'rabbitmq',
  OLLAMA = 'ollama',
  N8N = 'n8n',
  KESTRA = 'kestra',
  AUTHELIA = 'authelia',
  LOCALSTACK = 'localstack',
  ONEDEV = 'onedev',
  SONARQUBE = 'sonarqube',
  TRIVY = 'trivy',
  REGISTRY = 'registry',
  VAULT = 'vault',
  PHP = 'php',
  PSITRANSFER = 'psitransfer',
  EXCALIDRAW = 'excalidraw',
  OUTLINE = 'outline',
  GRIST = 'grist',
  NOCODB = 'nocodb',
}

// Configuration interface
export interface HomelabConfig {
  ip: string;
  domain: string;
  networkName: string;
  databasePassword?: string;
  selectedServices: ServiceType[];
  distribution: DistributionType;
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
