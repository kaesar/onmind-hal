/**
 * CLI prompts using inquirer.js for user configuration
 */

import inquirer from 'inquirer';
import { ServiceType, HomelabConfig } from '../core/types.js';
import {
  validateIP as validateIPUtil,
  validateDomain as validateDomainUtil,
  validateNetworkName as validateNetworkNameUtil,
  validateDatabasePassword,
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
    validateDatabasePassword(sanitizeUserInput(input));
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
      name: 'n8n - Workflow automation platform',
      value: ServiceType.N8N,
      short: 'n8n'
    },
    {
      name: 'PostgreSQL - SQL database server',
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
      name: 'Minio - S3-compatible object storage',
      value: ServiceType.MINIO,
      short: 'Minio'
    },
    {
      name: 'Ollama - Local LLM server',
      value: ServiceType.OLLAMA,
      short: 'Ollama'
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

export async function promptForDatabasePassword(): Promise<string> {
  const { password } = await inquirer.prompt([
    {
      type: 'password',
      name: 'password',
      message: 'Enter database password (for PostgreSQL/MariaDB):',
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
  
  let databasePassword: string | undefined;
  if (optionalServices.includes(ServiceType.POSTGRESQL) || optionalServices.includes(ServiceType.MARIADB)) {
    databasePassword = await promptForDatabasePassword();
  }

  // Core services are always included
  const coreServices = [ServiceType.CADDY, ServiceType.PORTAINER, ServiceType.COPYPARTY];
  const selectedServices = [...coreServices, ...optionalServices];

  return {
    ip,
    domain,
    networkName,
    databasePassword,
    selectedServices
  };
}