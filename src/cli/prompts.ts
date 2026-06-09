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
import { ValidationError } from '../utils/errors.js';
import { ContainerRuntimeUtils } from '../utils/container.js';

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
export async function promptForIP(): Promise<string> {
  const { ip } = await inquirer.prompt([
    {
      type: 'input',
      name: 'ip',
      message: 'Enter your server IP address:',
      validate: validateIP,
      default: '192.168.1.100'
    }
  ]);
  return ip.trim();
}

export async function promptForDomain(): Promise<string> {
  const { domain } = await inquirer.prompt([
    {
      type: 'input',
      name: 'domain',
      message: 'Enter your domain name:',
      validate: validateDomain,
      default: 'homelab.lan'
    }
  ]);
  return domain.trim();
}

export async function promptForNetworkName(): Promise<string> {
  const { networkName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'networkName',
      message: 'Enter Docker network name:',
      validate: validateNetworkName,
      default: 'homelab-network'
    }
  ]);
  return networkName.trim();
}

export async function promptForOptionalServices(): Promise<ServiceType[]> {
  const optionalServices = [
    {
      name: 'RustFS - High-performance S3-compatible distributed object storage',
      value: ServiceType.RUSTFS,
      short: 'RustFS'
    },
    {
      name: 'DuckDB - In-memory analytical database with web UI',
      value: ServiceType.DUCKDB,
      short: 'DuckDB'
    },
    {
      name: 'PostgreSQL - SQL database server (alternative to Oracle DB)',
      value: ServiceType.POSTGRESQL,
      short: 'PostgreSQL'
    },
    {
      name: 'Redis - In-memory data store',
      value: ServiceType.REDIS,
      short: 'Redis'
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
      name: 'Apache Ignite - Distributed in-memory database with SQL and JDBC',
      value: ServiceType.IGNITE,
      short: 'Apache Ignite'
    },
    {
      name: 'Kafka - Distributed streaming platform (with KRaft)',
      value: ServiceType.KAFKA,
      short: 'Kafka'
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
      name: 'PocketID - OIDC provider with passkeys support (for Caddy + oauth2-proxy)',
      value: ServiceType.POCKETID,
      short: 'PocketID'
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
      name: 'LocalStack - Local AWS cloud stack',
      value: ServiceType.LOCALSTACK,
      short: 'LocalStack'
    },
    {
      name: 'k3d - Lightweight Kubernetes in Docker',
      value: ServiceType.K3D,
      short: 'k3d'
    },
    {
      name: 'OneDev - Self-hosted Git server with CI/CD',
      value: ServiceType.ONEDEV,
      short: 'OneDev'
    },
    {
      name: 'Semaphore UI - Modern UI for Ansible and shell automation',
      value: ServiceType.SEMAPHORE,
      short: 'Semaphore'
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
      name: 'Locust - Open source load testing tool (K6/JMeter alternative)',
      value: ServiceType.LOCUST,
      short: 'Locust'
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
      name: 'OpenSearch - Search and analytics engine (Elasticsearch alternative)',
      value: ServiceType.OPENSEARCH,
      short: 'OpenSearch'
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
      name: 'Fluent Bit - Lightweight log processor and forwarder',
      value: ServiceType.FLUENTBIT,
      short: 'Fluent Bit'
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
      short: 'Infisical'
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
      name: 'BackVault - Self-hosted backup solution for Vaultwarden/Bitwarden',
      value: ServiceType.BACKVAULT,
      short: 'BackVault'
    },
    {
      name: 'Linkwarden - Self-hosted bookmark manager (requires PostgreSQL)',
      value: ServiceType.LINKWARDEN,
      short: 'Linkwarden'
    },
    {
      name: 'PsiTransfer - File sharing platform (like WeTransfer)',
      value: ServiceType.PSITRANSFER,
      short: 'PsiTransfer'
    },
    {
      name: 'Filestash - Web-based file manager for any storage backend',
      value: ServiceType.FILESTASH,
      short: 'Filestash'
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
      name: 'TwentyCRM - Modern open-source CRM platform',
      value: ServiceType.TWENTYCRM,
      short: 'TwentyCRM'
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
      name: 'JasperReports - Business intelligence and reporting platform (requires PostgreSQL)',
      value: ServiceType.JASPERREPORTS,
      short: 'JasperReports'
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
      name: 'OrcaRouter Lite - Lightweight LLM router with multi-provider support',
      value: ServiceType.ORCAROUTERLITE,
      short: 'OrcaRouter Lite'
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
      name: 'Hermes Agent - Self-improving AI agent with persistent memory (requires API key)',
      value: ServiceType.HERMES,
      short: 'Hermes'
    },
    {
      name: 'OpenClaw - AI agent gateway for Claude Code, OpenAI Codex and more',
      value: ServiceType.OPENCLAW,
      short: 'OpenClaw'
    },
    {
      name: 'OpenHuman - Open-source AI agent platform with Rust core',
      value: ServiceType.OPENHUMAN,
      short: 'OpenHuman'
    },
    {
      name: 'OpenJarvis - AI assistant platform with Ollama backend',
      value: ServiceType.OPENJARVIS,
      short: 'OpenJarvis'
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
      name: 'Docker Mailserver - Full-featured mail server',
      value: ServiceType.MAILSERVER,
      short: 'Mailserver'
    },
    {
      name: 'Kurrier - Self-hosted email marketing and newsletter platform',
      value: ServiceType.KURRIER,
      short: 'Kurrier'
    },
    {
      name: 'Zrok - Zero-trust tunneling platform (NGROK alternative) with OpenZiti',
      value: ServiceType.ZROK,
      short: 'Zrok'
    },
    {
      name: 'Cloudflare Tunnel - Secure tunnel to expose services (requires Cloudflare account)',
      value: ServiceType.CLOUDFLARED,
      short: 'Cloudflared'
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
  const { password } = await inquirer.prompt([
    {
      type: 'password',
      name: 'password',
      message: 'Enter database password (for PostgreSQL/MariaDB/MongoDB):',
      validate: validatePassword,
      mask: '*'
    }
  ]);
  return password.trim();
}

export async function promptForConfigPath(): Promise<string> {
  const { configPath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'configPath',
      message: 'Enter configuration files directory:',
      default: 'ws/init'
    }
  ]);
  return configPath.trim();
}

export async function promptForDataPath(): Promise<string> {
  const { dataPath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'dataPath',
      message: 'Enter data and storage directory:',
      default: 'ws/data'
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

export async function promptForDockerManagementUI(): Promise<ServiceType> {
  try {
    const runtime = await ContainerRuntimeUtils.detectRuntime();

    if (runtime === 'podman') {
      console.log('🦭 Podman detected: Portainer will be used for container management');
      return ServiceType.PORTAINER;
    }

    const { managementUI } = await inquirer.prompt([
      {
        type: 'list',
        name: 'managementUI',
        message: 'Select container management UI:',
        choices: [
          { name: 'Dockhand - Lightweight Docker management UI (default)', value: ServiceType.DOCKHAND },
          { name: 'Portainer - Full-featured container management interface', value: ServiceType.PORTAINER }
        ],
        default: ServiceType.DOCKHAND
      }
    ]);

    return managementUI;
  } catch {
    console.log('⚠️  No container runtime detected. Defaulting to Dockhand.');
    return ServiceType.DOCKHAND;
  }
}

// Main configuration collection function
export async function collectUserConfiguration(): Promise<Partial<HomelabConfig>> {
  console.log('🏠 HomeLab Configuration Setup');
  console.log('Please provide the following information to configure your HomeLab:\n');

  const ip = await promptForIP();
  const domain = await promptForDomain();
  const networkName = await promptForNetworkName();
  const configPath = await promptForConfigPath();
  const dataPath = await promptForDataPath();
  
  const managementUI = await promptForDockerManagementUI();
  console.log(`   ✓ ${managementUI === ServiceType.DOCKHAND ? 'Dockhand' : 'Portainer'} selected for container management`);

  const optionalServices = await promptForOptionalServices();
  
  let storagePassword: string | undefined;
  if (optionalServices.includes(ServiceType.POSTGRESQL) || 
      optionalServices.includes(ServiceType.MARIADB) || 
      optionalServices.includes(ServiceType.MONGODB)) {
    storagePassword = await promptForStoragePassword();
  }

  // Core services are always included
  const coreServices = [ServiceType.CADDY, ServiceType.COPYPARTY];
  const selectedServices = [...coreServices, managementUI, ...optionalServices];

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