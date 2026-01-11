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
      name: 'Minio - S3-compatible object storage',
      value: ServiceType.MINIO,
      short: 'Minio'
    },
    {
      name: 'Kafka - Distributed streaming platform (with KRaft)',
      value: ServiceType.KAFKA,
      short: 'Kafka'
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
      name: 'Cockpit CMS - Headless CMS even with GraphQL (this also is for PHP)',
      value: ServiceType.COCKPIT,
      short: 'Cockpit'
    },
    {
      name: 'Authelia - Authentication and authorization server (requires Redis)',
      value: ServiceType.AUTHELIA,
      short: 'Authelia'
    },
    {
      name: 'LocalStack - Local AWS cloud stack',
      value: ServiceType.LOCALSTACK,
      short: 'LocalStack'
    },
    {
      name: 'OneDev - Self-hosted Git server with CI/CD',
      value: ServiceType.ONEDEV,
      short: 'OneDev'
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
      name: 'Vault - Secrets and encryption management (HashiCorp)',
      value: ServiceType.VAULT,
      short: 'Vault'
    },
    {
      name: 'PsiTransfer - File sharing platform (like WeTransfer)',
      value: ServiceType.PSITRANSFER,
      short: 'PsiTransfer'
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
      name: 'Plane - Modern project management platform (like Jira)',
      value: ServiceType.PLANE,
      short: 'Plane'
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
      name: 'Docker Mailserver - Full-featured mail server',
      value: ServiceType.MAILSERVER,
      short: 'Mailserver'
    },
    {
      name: 'FRP Client - Fast Reverse Proxy for secure tunneling (requires VPS with frps)',
      value: ServiceType.FRP,
      short: 'FRP'
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

// Main configuration collection function
export async function collectUserConfiguration(): Promise<Partial<HomelabConfig>> {
  console.log('🏠 HomeLab Configuration Setup');
  console.log('Please provide the following information to configure your HomeLab:\n');

  const ip = await promptForIP();
  const domain = await promptForDomain();
  const networkName = await promptForNetworkName();
  
  const optionalServices = await promptForOptionalServices();
  
  let storagePassword: string | undefined;
  if (optionalServices.includes(ServiceType.POSTGRESQL) || 
      optionalServices.includes(ServiceType.MARIADB) || 
      optionalServices.includes(ServiceType.MONGODB)) {
    storagePassword = await promptForStoragePassword();
  }

  // Core services are always included
  const coreServices = [ServiceType.CADDY, ServiceType.PORTAINER, ServiceType.COPYPARTY, ServiceType.DUCKDB];
  const selectedServices = [...coreServices, ...optionalServices];

  return {
    ip,
    domain,
    networkName,
    storagePassword,
    selectedServices
  };
}