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
  N8N = 'n8n',
  POSTGRESQL = 'postgresql',
  REDIS = 'redis',
  MONGODB = 'mongodb',
  MINIO = 'minio',
  OLLAMA = 'ollama'
}

// Configuration interface
export interface HomelabConfig {
  ip: string;
  domain: string;
  networkName: string;
  postgresPassword?: string;
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