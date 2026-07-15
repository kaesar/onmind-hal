/**
 * CLI prompts using inquirer.js for user configuration
 */

import inquirer from 'inquirer';
import { ServiceType, HomelabConfig } from '../core/types.js';
import {
  validateIP as validateIPUtil,
  validateDomain as validateDomainUtil,
  validateNetworkName as validateNetworkNameUtil,
  validateStoragePassword,
  sanitizeUserInput
} from '../utils/validation.js';
import { HomelabError, ValidationError } from '../utils/errors.js';
import { ContainerRuntimeUtils } from '../utils/container.js';
import { NetworkUtils } from '../utils/network.js';

export const DEFAULT_OPTIONAL_SERVICES: ServiceType[] = [
  ServiceType.RUSTFS,
  ServiceType.POSTGRESQL,
  ServiceType.REDIS,
  ServiceType.KAFKA,
  ServiceType.TINYAUTH,
  ServiceType.NTFY,
  ServiceType.MAILPIT,
  // ServiceType.INFISCAL,
  ServiceType.CLOUDFLARED,
];

const CORE_SERVICES: ServiceType[] = [ServiceType.CADDY, ServiceType.COPYPARTY];

// Wrapper functions for inquirer validation (return string for error, true for success)
export function validateIP(input: string): boolean | string {
  try {
    if (!input || !input.trim()) {
      return 'IP address is required';
    }
    validateIPUtil(sanitizeUserInput(input));
    return true;
  } catch (error) {
    return 'Please enter a valid IP address (e.g., 192.168.1.100)';
  }
}

export function validateDomain(input: string): boolean | string {
  try {
    if (!input || !input.trim()) {
      return 'Domain is required';
    }
    validateDomainUtil(sanitizeUserInput(input));
    return true;
  } catch (error) {
    return 'Please enter a valid domain (e.g., homelab.lan or example.com)';
  }
}

export function validateNetworkName(input: string): boolean | string {
  try {
    if (!input || !input.trim()) {
      return 'Network name is required';
    }
    if (input.trim().length < 2) {
      return 'Network name must be at least 2 characters long';
    }
    validateNetworkNameUtil(sanitizeUserInput(input));
    return true;
  } catch (error) {
    return 'Network name can only contain letters, numbers, hyphens, and underscores';
  }
}

export function validatePassword(input: string): boolean | string {
  try {
    if (!input || !input.trim()) {
      return 'Password is required';
    }
    if (input.trim().length < 8) {
      return 'Password must be at least 8 characters long';
    }
    validateStoragePassword(sanitizeUserInput(input));
    return true;
  } catch (error) {
    return error instanceof ValidationError ? error.message : 'Password must be at least 8 characters long';
  }
}

// Prompt functions
export async function promptForIP(defaultValue?: string): Promise<string> {
  const localIP = await NetworkUtils.detectLocalIP();

  const { ip } = await inquirer.prompt([
    {
      type: 'input',
      name: 'ip',
      message: 'Enter your server IP address:',
      validate: validateIP,
      default: defaultValue || localIP || '192.168.1.100'
    }
  ]);
  return ip.trim();
}

export async function promptForDomain(defaultValue?: string): Promise<string> {
  const { domain } = await inquirer.prompt([
    {
      type: 'input',
      name: 'domain',
      message: 'Enter your domain name:',
      validate: validateDomain,
      default: defaultValue || 'homelab.lan'
    }
  ]);
  return domain.trim();
}

export async function promptForNetworkName(defaultValue?: string): Promise<string> {
  const { networkName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'networkName',
      message: 'Enter Docker network name:',
      validate: validateNetworkName,
      default: defaultValue || 'homelab-network'
    }
  ]);
  return networkName.trim();
}

export async function promptForOptionalServices(previousServices?: ServiceType[]): Promise<ServiceType[]> {
  const usePrevious = Array.isArray(previousServices);
  const optionalServices = [
    {
      name: 'RustFS - High-performance S3-compatible distributed object storage',
      value: ServiceType.RUSTFS,
      short: 'RustFS',
    },
    {
      name: 'DuckDB - In-memory analytical database with web UI',
      value: ServiceType.DUCKDB,
      short: 'DuckDB'
    },
    {
      name: 'PostgreSQL - SQL database server (alternative to Oracle DB)',
      value: ServiceType.POSTGRESQL,
      short: 'PostgreSQL',
    },
    {
      name: 'Redis - In-memory data store',
      value: ServiceType.REDIS,
      short: 'Redis',
    },
    {
      name: 'MongoDB - NoSQL document database',
      value: ServiceType.MONGODB,
      short: 'MongoDB'
    },
    {
      name: 'MariaDB - SQL database server',
      value: ServiceType.MARIADB,
      short: 'MariaDB'
    },
    {
      name: 'ScyllaDB - NoSQL Cassandra-compatible database',
      value: ServiceType.SCYLLADB,
      short: 'ScyllaDB'
    },
    {
      name: 'OpenSearch - Search and analytics engine (Elasticsearch alternative)',
      value: ServiceType.OPENSEARCH,
      short: 'OpenSearch'
    },
    {
      name: 'Qdrant - Vector database for AI and RAG applications',
      value: ServiceType.QDRANT,
      short: 'Qdrant'
    },
    {
      name: 'Kafka - Distributed streaming platform (with KRaft)',
      value: ServiceType.KAFKA,
      short: 'Kafka',
    },
    {
      name: 'Kafka UI - Web UI for managing Apache Kafka',
      value: ServiceType.KAFKAUI,
      short: 'Kafka UI'
    },
    {
      name: 'RabbitMQ - Message broker for distributed systems',
      value: ServiceType.RABBITMQ,
      short: 'RabbitMQ'
    },
    {
      name: 'Ollama - Local LLM server',
      value: ServiceType.OLLAMA,
      short: 'Ollama'
    },
    {
      name: 'Open WebUI - User-friendly web interface for Ollama (requires Ollama)',
      value: ServiceType.OPENWEBUI,
      short: 'Open WebUI'
    },
    {
      name: 'Open NotebookLM - Open-source alternative to Google NotebookLM',
      value: ServiceType.OPENNOTEBOOKLM,
      short: 'Open NotebookLM'
    },
    {
      name: 'n8n - Workflow automation platform',
      value: ServiceType.N8N,
      short: 'n8n'
    },
    {
      name: 'ToolJet - Open-source low-code platform for building internal tools',
      value: ServiceType.TOOLJET,
      short: 'ToolJet'
    },
    {
      name: 'Kestra - Orchestration and scheduling platform',
      value: ServiceType.KESTRA,
      short: 'Kestra'
    },
    {
      name: 'KeystoneJS - Modern headless CMS and GraphQL API (requires PostgreSQL)',
      value: ServiceType.KEYSTONEJS,
      short: 'KeystoneJS'
    },
    {
      name: 'Keycloak - Open-source identity and access management solution (requires PostgreSQL)',
      value: ServiceType.KEYCLOAK,
      short: 'Keycloak'
    },
    {
      name: 'Authelia - Authentication and authorization server (requires Redis)',
      value: ServiceType.AUTHELIA,
      short: 'Authelia'
    },
    {
      name: 'Tinyauth - Lightweight OIDC authentication server with OAuth and LDAP support',
      value: ServiceType.TINYAUTH,
      short: 'Tinyauth',
    },
    {
      name: 'PocketID - OIDC provider with passkeys support (for Caddy + oauth2-proxy)',
      value: ServiceType.POCKETID,
      short: 'PocketID',
    },
    {
      name: 'Apache APISIX - Cloud-native API Gateway and microservices management',
      value: ServiceType.APISIX,
      short: 'APISIX'
    },
    {
      name: 'Floci - LocalStack alternative - AWS service emulator for local development',
      value: ServiceType.FLOCI,
      short: 'Floci'
    },
    {
      name: 'Floci-AZ - Azure service emulator for local development',
      value: ServiceType.FLOCIAZ,
      short: 'Floci-AZ'
    },
    {
      name: 'Floci-GCP - GCP service emulator for local development',
      value: ServiceType.FLOCIGCP,
      short: 'Floci-GCP'
    },
    {
      name: 'k3d - Lightweight Kubernetes in Docker',
      value: ServiceType.K3D,
      short: 'k3d'
    },
    {
      name: 'Code Server - Web-based VS Code IDE (code-server)',
      value: ServiceType.CODESERVER,
      short: 'Code Server'
    },
    {
      name: 'JupyterLab - Web-based interactive development environment for notebooks and code',
      value: ServiceType.JUPYTERLAB,
      short: 'JupyterLab'
    },
    {
      name: 'Forgejo - Self-hosted lightweight Git server with CI/CD (Gitea fork)',
      value: ServiceType.FORGEJO,
      short: 'Forgejo'
    },
    {
      name: 'OneDev - Self-hosted Git server with CI/CD',
      value: ServiceType.ONEDEV,
      short: 'OneDev'
    },
    {
      name: 'Jenkins - Automation server for building, testing, and deploying software',
      value: ServiceType.JENKINS,
      short: 'Jenkins'
    },
    {
      name: 'Semaphore UI - Modern UI for Ansible and shell automation',
      value: ServiceType.SEMAPHORE,
      short: 'Semaphore'
    },
    {
      name: 'Backstage - Developer portal platform (Developer Portal by Spotify)',
      value: ServiceType.BACKSTAGE,
      short: 'Backstage'
    },
    {
      name: 'Liquibase - Database schema change management',
      value: ServiceType.LIQUIBASE,
      short: 'Liquibase'
    },
    {
      name: 'SonarQube CE - Code quality and security analysis',
      value: ServiceType.SONARQUBE,
      short: 'SonarQube'
    },
    {
      name: 'Trivy - Container security scanner',
      value: ServiceType.TRIVY,
      short: 'Trivy'
    },
    {
      name: 'RapiDoc - WebComponent for OpenAPI Spec viewer',
      value: ServiceType.RAPIDOC,
      short: 'RapiDoc'
    },
    {
      name: 'Hoppscotch - Open-source API development ecosystem (Postman alternative)',
      value: ServiceType.HOPPSCOTCH,
      short: 'Hoppscotch'
    },
    {
      name: 'K6 OSS - Open-source load testing tool (Grafana)',
      value: ServiceType.K6,
      short: 'K6 OSS'
    },
    {
      name: 'Grafana - Analytics and monitoring platform',
      value: ServiceType.GRAFANA,
      short: 'Grafana'
    },
    {
      name: 'Loki - Log aggregation system',
      value: ServiceType.LOKI,
      short: 'Loki'
    },
    {
      name: 'Prometheus - Open-source systems monitoring and alerting toolkit',
      value: ServiceType.PROMETHEUS,
      short: 'Prometheus'
    },
    {
      name: 'Fluent Bit - Lightweight log processor and forwarder',
      value: ServiceType.FLUENTBIT,
      short: 'Fluent Bit'
    },
    {
      name: 'Coroot - Open-source observability and monitoring platform',
      value: ServiceType.COROOT,
      short: 'Coroot'
    },
    {
      name: 'ReDash - SQL query editor and visualization platform',
      value: ServiceType.REDASH,
      short: 'ReDash'
    },
    {
      name: 'Uptime Kuma - Self-hosted uptime monitoring tool',
      value: ServiceType.UPTIMEKUMA,
      short: 'Uptime Kuma'
    },
    {
      name: 'Dozzle - Lightweight Docker log viewer and monitor',
      value: ServiceType.DOZZLE,
      short: 'Dozzle'
    },
    {
      name: 'Registry - Private Docker container registry',
      value: ServiceType.REGISTRY,
      short: 'Registry'
    },
    {
      name: 'Nexus Repository - Universal artifact repository manager',
      value: ServiceType.NEXUS,
      short: 'Nexus'
    },
    {
      name: 'Infisical - Open-source secret management platform',
      value: ServiceType.INFISCAL,
      short: 'Infisical',
    },
    {
      name: 'Vault - Secrets and encryption management (HashiCorp)',
      value: ServiceType.VAULT,
      short: 'Vault'
    },
    {
      name: 'Consul - Service discovery and configuration (HashiCorp)',
      value: ServiceType.CONSUL,
      short: 'Consul'
    },
    {
      name: 'Vaultwarden - Self-hosted Bitwarden-compatible password manager',
      value: ServiceType.VAULTWARDEN,
      short: 'Vaultwarden'
    },
    {
      name: 'Linkwarden - Self-hosted bookmark manager (requires PostgreSQL)',
      value: ServiceType.LINKWARDEN,
      short: 'Linkwarden'
    },
    {
      name: 'Shlink - URL shortener with REST API and web interface',
      value: ServiceType.SHLINK,
      short: 'Shlink'
    },
    {
      name: 'Send - Simple, private file sharing with end-to-end encryption (Firefox Send fork)',
      value: ServiceType.SEND,
      short: 'Send'
    },
    {
      name: 'Filestash - Web-based file manager for any storage backend',
      value: ServiceType.FILESTASH,
      short: 'Filestash'
    },
    {
      name: 'Seafile - Self-hosted file sync and share platform (Google Drive alternative)',
      value: ServiceType.SEAFILE,
      short: 'Seafile'
    },
    {
      name: 'Excalidraw - Virtual whiteboard for sketching',
      value: ServiceType.EXCALIDRAW,
      short: 'Excalidraw'
    },
    {
      name: 'Draw.io - Web-based diagramming application',
      value: ServiceType.DRAWIO,
      short: 'Draw.io'
    },
    {
      name: 'WiseMapping - Web-based mind mapping tool (requires PostgreSQL)',
      value: ServiceType.WISEMAPPING,
      short: 'WiseMapping'
    },
    {
      name: 'Kroki - API for generating diagrams',
      value: ServiceType.KROKI,
      short: 'Kroki'
    },
    {
      name: 'Presenton - Open-source AI presentation generator (Gamma/Canva alternative)',
      value: ServiceType.PRESENTON,
      short: 'Presenton'
    },
    {
      name: 'Slidev - Presentation slides for developers (Markdown-based)',
      value: ServiceType.SLIDEV,
      short: 'Slidev'
    },
    {
      name: 'Outline - Team knowledge base and wiki (requires PostgreSQL + Redis)',
      value: ServiceType.OUTLINE,
      short: 'Outline'
    },
    {
      name: 'Grist - Modern spreadsheet with relational database',
      value: ServiceType.GRIST,
      short: 'Grist'
    },
    {
      name: 'NocoDB - Open-source Airtable alternative',
      value: ServiceType.NOCODB,
      short: 'NocoDB'
    },
    {
      name: 'Directus - Open-source headless CMS and backend-as-a-service',
      value: ServiceType.DIRECTUS,
      short: 'Directus'
    },
    {
      name: 'InsForge - Open-source backend platform for AI coding agents (database, auth, storage, AI gateway)',
      value: ServiceType.INSFORGE,
      short: 'InsForge'
    },
    {
      name: 'Apache Spark - Unified analytics engine for large-scale data processing',
      value: ServiceType.SPARK,
      short: 'Apache Spark'
    },
    {
      name: 'TwentyCRM - Modern open-source CRM platform',
      value: ServiceType.TWENTYCRM,
      short: 'TwentyCRM'
    },
    {
      name: 'Chatwoot - Open-source customer engagement platform (Intercom/Zendesk alternative)',
      value: ServiceType.CHATWOOT,
      short: 'Chatwoot'
    },
    {
      name: 'MedusaJS - Headless e-commerce platform (Shopify alternative)',
      value: ServiceType.MEDUSAJS,
      short: 'MedusaJS'
    },
    {
      name: 'Huly - All-in-one project management platform (Linear + Notion + GitHub alternative)',
      value: ServiceType.HULY,
      short: 'Huly'
    },
    {
      name: 'Mattermost - Open-source team collaboration platform (like Slack, requires PostgreSQL)',
      value: ServiceType.MATTERMOST,
      short: 'Mattermost'
    },
    {
      name: 'Cal.com - Open-source scheduling platform (Calendly alternative, requires PostgreSQL)',
      value: ServiceType.CALCOM,
      short: 'Cal.com'
    },
    {
      name: 'AdGuard Home - Network-wide ad and tracker blocking DNS server',
      value: ServiceType.ADGUARD,
      short: 'AdGuard Home'
    },
    {
      name: 'JasperReports - Business intelligence and reporting platform (requires PostgreSQL)',
      value: ServiceType.JASPERREPORTS,
      short: 'JasperReports'
    },
    {
      name: 'DocuSeal - Open-source document signing and PDF form filling platform',
      value: ServiceType.DOCUSEAL,
      short: 'DocuSeal'
    },
    {
      name: 'Stirling-PDF - Powerful locally hosted PDF manipulation tool',
      value: ServiceType.STIRLINGPDF,
      short: 'Stirling-PDF'
    },
    {
      name: 'LibreTranslate - Free and open source machine translation API',
      value: ServiceType.LIBRETRANSLATE,
      short: 'LibreTranslate'
    },
    {
      name: 'LiteLLM - LLM proxy with unified API for 100+ LLMs',
      value: ServiceType.LITELLM,
      short: 'LiteLLM'
    },
    {
      name: 'AnythingLLM - Multi-user AI platform with RAG, Agents, and local LLM support',
      value: ServiceType.ANYTHINGLLM,
      short: 'AnythingLLM'
    },
    {
      name: 'LightRAG - Simple and fast graph-based Retrieval-Augmented Generation',
      value: ServiceType.LIGHTRAG,
      short: 'LightRAG'
    },
    {
      name: 'Voicebox - Open-source AI voice studio with voice cloning and TTS',
      value: ServiceType.VOICEBOX,
      short: 'Voicebox'
    },
    {
      name: 'CopilotKit - Open-source AI agent runtime with multi-provider support and AG-UI protocol',
      value: ServiceType.COPILOTKIT,
      short: 'CopilotKit'
    },
    {
      name: 'Goose - Open-source AI agent for code, workflows, and automation (AAIF/Linux Foundation)',
      value: ServiceType.GOOSE,
      short: 'Goose'
    },
    {
      name: 'Hermes - Self-improving AI agent with persistent memory (requires API key)',
      value: ServiceType.HERMES,
      short: 'Hermes'
    },
    {
      name: 'OpenClaw - AI agent gateway for Claude Code, OpenAI Codex and more',
      value: ServiceType.OPENCLAW,
      short: 'OpenClaw'
    },
    {
      name: 'Firecrawl - Open-source web scraping API with JavaScript rendering',
      value: ServiceType.FIRECRAWL,
      short: 'Firecrawl'
    },
    {
      name: 'SearXNG - Privacy-respecting metasearch engine',
      value: ServiceType.SEARXNG,
      short: 'SearXNG'
    },
    {
      name: 'Plausible Analytics - Open-source web analytics platform (requires PostgreSQL)',
      value: ServiceType.PLAUSIBLE,
      short: 'Plausible'
    },
    {
      name: 'Ntfy - Self-hosted push notification server with pub/sub topics, iOS/Android apps, and attachments',
      value: ServiceType.NTFY,
      short: 'Ntfy',
    },
    {
      name: 'Mailpit - Email testing tool for developers (fake SMTP server with web UI)',
      value: ServiceType.MAILPIT,
      short: 'Mailpit',
    },
    {
      name: 'Docker Mailserver - Full-featured mail server',
      value: ServiceType.MAILSERVER,
      short: 'Mailserver'
    },
    {
      name: 'Listmonk - Self-hosted newsletter and mailing list manager',
      value: ServiceType.LISTMONK,
      short: 'Listmonk'
    },
    {
      name: 'Cloudflare Tunnel - Secure tunnel to expose services (requires Cloudflare account)',
      value: ServiceType.CLOUDFLARED,
      short: 'Cloudflared',
    },
    {
      name: 'Headscale - Self-hosted VPN server (Tailscale control server) with WireGuard',
      value: ServiceType.HEADSCALE,
      short: 'Headscale'
    },
    {
      name: 'Wetty - Web-based SSH terminal for secure host access',
      value: ServiceType.WETTY,
      short: 'Wetty'
    },
    {
      name: 'RustDesk Server - Open-source remote desktop server',
      value: ServiceType.RUSTDESK,
      short: 'RustDesk'
    }
  ];

  // Apply checked state for all services based on previous selection or defaults
  for (const service of optionalServices) {
    service.checked = usePrevious
      ? previousServices.includes(service.value)
      : DEFAULT_OPTIONAL_SERVICES.includes(service.value);
  }

  const { services } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'services',
      message: 'Select optional services to install:',
      choices: optionalServices,
      validate: (input: ServiceType[]) => {
        // Allow empty selection - all services are optional
        return true;
      }
    }
  ]);

  return services;
}

export async function promptForStoragePassword(): Promise<string> {
  const yearSuffix = String(new Date().getFullYear()).slice(-2);
  const defaultPassword = `Admin${yearSuffix}!`;

  const { password } = await inquirer.prompt([
    {
      type: 'password',
      name: 'password',
      message: 'Enter database password (for PostgreSQL/MariaDB/MongoDB):',
      validate: validatePassword,
      mask: '*',
      default: defaultPassword
    }
  ]);
  return password.trim();
}

export async function promptForConfigPath(defaultValue?: string): Promise<string> {
  const { configPath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'configPath',
      message: 'Enter configuration files directory:',
      default: defaultValue || 'ws/init'
    }
  ]);
  return configPath.trim();
}

export async function promptForDataPath(defaultValue?: string): Promise<string> {
  const { dataPath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'dataPath',
      message: 'Enter data and storage directory:',
      default: defaultValue || 'ws/data'
    }
  ]);
  return dataPath.trim();
}

export async function promptForConfirmation(message: string): Promise<boolean> {
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message,
      default: true
    }
  ]);
  return confirmed;
}

export async function promptForDockerManagementUI(defaultValue?: ServiceType): Promise<ServiceType> {
  try {
    const runtime = await ContainerRuntimeUtils.detectRuntime();

    if (runtime === 'podman') {
      console.log('   ✓ Podman detected - Arcane will be used for container management');
      return ServiceType.ARCANE;
    }

    const { managementUI } = await inquirer.prompt([
      {
        type: 'list',
        name: 'managementUI',
        message: 'Select container management UI:',
        choices: [
          { name: 'Dockhand - Lightweight Docker management UI (default)', value: ServiceType.DOCKHAND },
          { name: 'Arcane - Modern container management interface', value: ServiceType.ARCANE }
        ],
        default: defaultValue || ServiceType.DOCKHAND
      }
    ]);

    return managementUI;
  } catch {
    console.log('⚠️  No container runtime detected. Defaulting to Dockhand.');
    return ServiceType.DOCKHAND;
  }
}

export type StateDecision = 'reuse' | 'fresh';

export async function promptForPreviousInstallation(
  installedAt: string,
  ip: string,
  domain: string,
  serviceCount: number,
): Promise<StateDecision> {
  const { decision } = await inquirer.prompt([
    {
      type: 'list',
      name: 'decision',
      message: 'What would you like to do?',
      choices: [
        { name: 'Reuse previous configuration and continue', value: 'reuse' },
        { name: 'Start fresh (ignore previous installation)', value: 'fresh' },
      ],
    },
  ]);
  return decision;
}

// Main configuration collection function
export async function collectUserConfiguration(previousServices?: ServiceType[], previousConfig?: Partial<HomelabConfig> & { managementUI?: ServiceType }): Promise<Partial<HomelabConfig>> {
  console.log('🏠 HomeLab Configuration Setup');
  console.log('Please provide the following information to configure your HomeLab:\n');

  const ip = await promptForIP(previousConfig?.ip);
  const domain = await promptForDomain(previousConfig?.domain);
  const networkName = await promptForNetworkName(previousConfig?.networkName);
  const configPath = await promptForConfigPath(previousConfig?.configPath);
  const dataPath = await promptForDataPath(previousConfig?.dataPath);

  const managementUI = await promptForDockerManagementUI(previousConfig?.managementUI);
  console.log(`   ✓ ${managementUI === ServiceType.DOCKHAND ? 'Dockhand' : 'Arcane'} selected for container management`);

  const optionalServices = await promptForOptionalServices(previousServices);
  
  let storagePassword: string | undefined;
  if (optionalServices.includes(ServiceType.POSTGRESQL) || 
      optionalServices.includes(ServiceType.MARIADB) || 
      optionalServices.includes(ServiceType.MONGODB)) {
    storagePassword = await promptForStoragePassword();
  }

  // Core services are always included
  const coreServices = [ServiceType.CADDY, ServiceType.COPYPARTY];
  const validServices = Object.values(ServiceType);
  const sanitizedOptional = optionalServices.filter(
    (s): s is ServiceType => s != null && validServices.includes(s),
  );
  const selectedServices = [...coreServices, managementUI, ...sanitizedOptional];

  return {
    ip,
    domain,
    networkName,
    configPath,
    dataPath,
    storagePassword,
    selectedServices
  };
}

const ALL_OPTIONAL_SERVICES: ServiceType[] = Object.values(ServiceType).filter(
  s => ![ServiceType.CADDY, ServiceType.COPYPARTY, ServiceType.DOCKHAND, ServiceType.ARCANE].includes(s),
);

export async function collectUserConfigurationFromArgs(
  ip: string | undefined,
  domain?: string,
  serviceNames?: string[],
  password?: string,
  excludedServices?: string[],
): Promise<Partial<HomelabConfig>> {
  let managementUI: ServiceType;
  try {
    const runtime = await ContainerRuntimeUtils.detectRuntime();
    if (runtime === 'podman') {
      managementUI = ServiceType.ARCANE;
    } else {
      managementUI = ServiceType.DOCKHAND;
    }
  } catch {
    managementUI = ServiceType.DOCKHAND;
  }

  // Auto-detect IP if not provided
  if (!ip) {
    const detected = await NetworkUtils.detectLocalIP();
    if (!detected) {
      throw new HomelabError(
        'Could not detect local IP address. Provide one with --ip <address>.',
        'NO_IP_DETECTED',
        false,
      );
    }
    ip = detected;
    console.log(`   ✓ Detected local IP: ${ip}`);
  }

  let optionalServices: ServiceType[];
  if (excludedServices) {
    const excludeSet = new Set(excludedServices);
    optionalServices = ALL_OPTIONAL_SERVICES.filter(s => !excludeSet.has(s));
    console.log(`   ✓ Installing ${optionalServices.length} optional services (excluded ${excludedServices.length})`);
  } else if (serviceNames && serviceNames.length > 0) {
    const result: ServiceType[] = [];
    for (const name of serviceNames) {
      if (name === 'defaults') {
        result.push(...DEFAULT_OPTIONAL_SERVICES);
      } else {
        const service = Object.values(ServiceType).find(v => v === name);
        if (service) result.push(service);
      }
    }
    optionalServices = [...new Set(result)];
    console.log(`   ✓ Installing ${optionalServices.length} optional services from --list`);
  } else {
    optionalServices = [...DEFAULT_OPTIONAL_SERVICES];
  }

  const selectedServices: ServiceType[] = [...CORE_SERVICES, managementUI, ...optionalServices];

  let storagePassword: string | undefined = password;
  if (!storagePassword &&
      (optionalServices.includes(ServiceType.POSTGRESQL) ||
       optionalServices.includes(ServiceType.MARIADB) ||
       optionalServices.includes(ServiceType.MONGODB))) {
    const yearSuffix = String(new Date().getFullYear()).slice(-2);
    storagePassword = `Admin${yearSuffix}!`;
  }

  return {
    ip,
    domain: domain || 'homelab.lan',
    networkName: 'homelab-network',
    configPath: 'ws/init',
    dataPath: 'ws/data',
    storagePassword,
    selectedServices,
  };
}