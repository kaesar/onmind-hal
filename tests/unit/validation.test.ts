/**
 * Unit tests for validation utilities
 */

import { describe, it, expect, beforeEach, spyOn } from 'bun:test';
import {
  validateIP,
  validateDomain,
  validateNetworkName,
  validatePostgresPassword,
  validateServiceSelection,
  validateServiceDependencies,
  validateDistribution,
  validateHomelabConfig,
  validateFilePath,
  sanitizeShellParameter,
  validateShellCommand,
  validateTemplateVariable,
  validateTemplateContent,
  sanitizeUserInput,
  validateEnvironmentVariable
} from '../../src/utils/validation.js';
import { ServiceType, DistributionType, HomelabConfig } from '../../src/core/types.js';
import { ValidationError, ConfigurationError } from '../../src/utils/errors.js';

describe('IP Validation', () => {
  it('should validate correct IP addresses', () => {
    expect(() => validateIP('192.168.1.1')).not.toThrow();
    expect(() => validateIP('10.0.0.1')).not.toThrow();
    expect(() => validateIP('172.16.0.1')).not.toThrow();
    expect(() => validateIP('127.0.0.1')).not.toThrow();
  });

  it('should reject invalid IP addresses', () => {
    expect(() => validateIP('999.999.999.999')).toThrow(ValidationError);
    expect(() => validateIP('192.168.1')).toThrow(ValidationError);
    expect(() => validateIP('192.168.1.256')).toThrow(ValidationError);
    expect(() => validateIP('not.an.ip.address')).toThrow(ValidationError);
    expect(() => validateIP('')).toThrow(ValidationError);
  });

  it('should reject non-string inputs', () => {
    expect(() => validateIP(null as any)).toThrow(ValidationError);
    expect(() => validateIP(undefined as any)).toThrow(ValidationError);
    expect(() => validateIP(123 as any)).toThrow(ValidationError);
  });

  it('should warn about public IP addresses', () => {
    const consoleSpy = spyOn(console, 'warn').mockImplementation(() => {});
    
    validateIP('8.8.8.8');
    expect(consoleSpy).toHaveBeenCalledWith('Warning: 8.8.8.8 appears to be a public IP address');
    
    consoleSpy.mockRestore();
  });
});

describe('Domain Validation', () => {
  it('should validate correct domain names', () => {
    expect(() => validateDomain('example.com')).not.toThrow();
    expect(() => validateDomain('sub.example.com')).not.toThrow();
    expect(() => validateDomain('test-domain.org')).not.toThrow();
    expect(() => validateDomain('localhost')).not.toThrow();
  });

  it('should reject invalid domain names', () => {
    expect(() => validateDomain('')).toThrow(ValidationError);
    expect(() => validateDomain('.')).toThrow(ValidationError);
    expect(() => validateDomain('.example.com')).toThrow(ValidationError);
    expect(() => validateDomain('example.com.')).toThrow(ValidationError);
    expect(() => validateDomain('-example.com')).toThrow(ValidationError);
    expect(() => validateDomain('example..com')).toThrow(ValidationError);
  });

  it('should reject domains that are too long', () => {
    const longDomain = 'a'.repeat(254) + '.com';
    expect(() => validateDomain(longDomain)).toThrow(ValidationError);
  });

  it('should reject non-string inputs', () => {
    expect(() => validateDomain(null as any)).toThrow(ValidationError);
    expect(() => validateDomain(undefined as any)).toThrow(ValidationError);
  });
});

describe('Network Name Validation', () => {
  it('should validate correct network names', () => {
    expect(() => validateNetworkName('homelab')).not.toThrow();
    expect(() => validateNetworkName('homelab-network')).not.toThrow();
    expect(() => validateNetworkName('homelab_network')).not.toThrow();
    expect(() => validateNetworkName('homelab.network')).not.toThrow();
  });

  it('should reject invalid network names', () => {
    expect(() => validateNetworkName('')).toThrow(ValidationError);
    expect(() => validateNetworkName('-homelab')).toThrow(ValidationError);
    expect(() => validateNetworkName('homelab-')).toThrow(ValidationError);
    expect(() => validateNetworkName('home lab')).toThrow(ValidationError);
  });

  it('should reject network names that are too long', () => {
    const longName = 'a'.repeat(64);
    expect(() => validateNetworkName(longName)).toThrow(ValidationError);
  });
});

describe('PostgreSQL Password Validation', () => {
  it('should validate strong passwords', () => {
    expect(() => validatePostgresPassword('StrongPass123!')).not.toThrow();
    expect(() => validatePostgresPassword('MySecurePassword2024')).not.toThrow();
  });

  it('should reject weak passwords', () => {
    expect(() => validatePostgresPassword('short')).toThrow(ValidationError);
    expect(() => validatePostgresPassword('password')).toThrow(ValidationError);
    expect(() => validatePostgresPassword('12345678')).toThrow(ValidationError);
    expect(() => validatePostgresPassword('admin123')).toThrow(ValidationError);
  });

  it('should reject passwords that are too long', () => {
    const longPassword = 'a'.repeat(129);
    expect(() => validatePostgresPassword(longPassword)).toThrow(ValidationError);
  });

  it('should reject passwords with invalid characters', () => {
    expect(() => validatePostgresPassword('password\x00')).toThrow(ValidationError);
  });
});

describe('Service Selection Validation', () => {
  it('should validate correct service selections', () => {
    const services = [ServiceType.CADDY, ServiceType.PORTAINER, ServiceType.COPYPARTY];
    expect(() => validateServiceSelection(services)).not.toThrow();
  });

  it('should validate service selections with optional services', () => {
    const services = [
      ServiceType.CADDY, 
      ServiceType.PORTAINER, 
      ServiceType.COPYPARTY,
      ServiceType.N8N,
      ServiceType.POSTGRESQL
    ];
    expect(() => validateServiceSelection(services)).not.toThrow();
  });

  it('should reject non-array inputs', () => {
    expect(() => validateServiceSelection('not-array' as any)).toThrow(ValidationError);
  });

  it('should reject invalid service types', () => {
    const services = [ServiceType.CADDY, 'invalid-service' as ServiceType];
    expect(() => validateServiceSelection(services)).toThrow(ValidationError);
  });

  it('should reject duplicate services', () => {
    const services = [ServiceType.CADDY, ServiceType.CADDY, ServiceType.PORTAINER];
    expect(() => validateServiceSelection(services)).toThrow(ValidationError);
  });

  it('should reject selections missing core services', () => {
    const services = [ServiceType.N8N]; // Missing core services
    expect(() => validateServiceSelection(services)).toThrow(ValidationError);
  });
});

describe('Service Dependencies Validation', () => {
  it('should validate correct dependencies', () => {
    const services = [
      ServiceType.CADDY,
      ServiceType.PORTAINER,
      ServiceType.COPYPARTY,
      ServiceType.N8N,
      ServiceType.POSTGRESQL
    ];
    expect(() => validateServiceDependencies(services)).not.toThrow();
  });

  it('should reject N8N without PostgreSQL', () => {
    const services = [ServiceType.CADDY, ServiceType.PORTAINER, ServiceType.COPYPARTY, ServiceType.N8N];
    expect(() => validateServiceDependencies(services)).toThrow(ValidationError);
  });

  it('should require all core services', () => {
    const services = [ServiceType.CADDY, ServiceType.PORTAINER]; // Missing Copyparty
    expect(() => validateServiceDependencies(services)).toThrow(ValidationError);
  });
});

describe('Distribution Validation', () => {
  it('should validate correct distributions', () => {
    expect(() => validateDistribution(DistributionType.UBUNTU)).not.toThrow();
    expect(() => validateDistribution(DistributionType.ARCH)).not.toThrow();
    expect(() => validateDistribution(DistributionType.AMAZON_LINUX)).not.toThrow();
  });

  it('should reject invalid distributions', () => {
    expect(() => validateDistribution('fedora' as DistributionType)).toThrow(ValidationError);
  });
});

describe('HomeLab Configuration Validation', () => {
  let validConfig: HomelabConfig;

  beforeEach(() => {
    validConfig = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.CADDY, ServiceType.PORTAINER, ServiceType.COPYPARTY],
      distribution: DistributionType.UBUNTU
    };
  });

  it('should validate correct configuration', () => {
    expect(() => validateHomelabConfig(validConfig)).not.toThrow();
  });

  it('should validate configuration with PostgreSQL', () => {
    validConfig.selectedServices.push(ServiceType.POSTGRESQL);
    validConfig.storagePassword = 'SecurePassword123!';
    expect(() => validateHomelabConfig(validConfig)).not.toThrow();
  });

  it('should reject configuration without PostgreSQL password when PostgreSQL is selected', () => {
    validConfig.selectedServices.push(ServiceType.POSTGRESQL);
    expect(() => validateHomelabConfig(validConfig)).toThrow(ConfigurationError);
  });

  it('should reject non-object configurations', () => {
    expect(() => validateHomelabConfig(null as any)).toThrow(ConfigurationError);
    expect(() => validateHomelabConfig('string' as any)).toThrow(ConfigurationError);
  });

  it('should reject configurations with invalid fields', () => {
    validConfig.ip = 'invalid-ip';
    expect(() => validateHomelabConfig(validConfig)).toThrow(ValidationError);
  });
});

describe('File Path Validation', () => {
  it('should validate safe file paths', () => {
    expect(() => validateFilePath('config.json')).not.toThrow();
    expect(() => validateFilePath('templates/service.json')).not.toThrow();
    expect(() => validateFilePath('/tmp/temp-file.txt')).not.toThrow();
  });

  it('should reject path traversal attempts', () => {
    expect(() => validateFilePath('../../../etc/passwd')).toThrow(ValidationError);
    expect(() => validateFilePath('config/../../../secret')).toThrow(ValidationError);
  });

  it('should reject dangerous absolute paths', () => {
    expect(() => validateFilePath('/etc/passwd')).toThrow(ValidationError);
    expect(() => validateFilePath('/root/.ssh/id_rsa')).toThrow(ValidationError);
  });

  it('should reject empty or invalid paths', () => {
    expect(() => validateFilePath('')).toThrow(ValidationError);
    expect(() => validateFilePath(null as any)).toThrow(ValidationError);
  });
});

describe('Shell Parameter Sanitization', () => {
  it('should sanitize safe parameters', () => {
    expect(sanitizeShellParameter('safe-parameter')).toBe('safe-parameter');
    expect(sanitizeShellParameter('parameter123')).toBe('parameter123');
  });

  it('should escape quotes', () => {
    expect(sanitizeShellParameter("param'with'quotes")).toBe("param\\'with\\'quotes");
    expect(sanitizeShellParameter('param"with"quotes')).toBe('param\\"with\\"quotes');
  });

  it('should reject dangerous parameters', () => {
    expect(() => sanitizeShellParameter('param; rm -rf /')).toThrow(ValidationError);
    expect(() => sanitizeShellParameter('param && malicious')).toThrow(ValidationError);
    expect(() => sanitizeShellParameter('param | cat /etc/passwd')).toThrow(ValidationError);
    expect(() => sanitizeShellParameter('param $(whoami)')).toThrow(ValidationError);
  });
});

describe('Shell Command Validation', () => {
  it('should validate allowed commands', () => {
    expect(() => validateShellCommand('docker --version')).not.toThrow();
    expect(() => validateShellCommand('apt update')).not.toThrow();
    expect(() => validateShellCommand('systemctl status docker')).not.toThrow();
  });

  it('should reject dangerous commands', () => {
    expect(() => validateShellCommand('rm -rf /')).toThrow(ValidationError);
    expect(() => validateShellCommand('sudo rm file')).toThrow(ValidationError);
    expect(() => validateShellCommand('chmod 777 file')).toThrow(ValidationError);
  });

  it('should reject commands with injection patterns', () => {
    expect(() => validateShellCommand('docker ps; rm file')).toThrow(ValidationError);
    expect(() => validateShellCommand('docker ps && malicious')).toThrow(ValidationError);
    expect(() => validateShellCommand('docker ps | grep malicious')).toThrow(ValidationError);
  });

  it('should reject commands not in allowed list', () => {
    expect(() => validateShellCommand('unknown-command')).toThrow(ValidationError);
  });
});

describe('Template Variable Validation', () => {
  it('should validate correct variable names', () => {
    expect(() => validateTemplateVariable('IP_ADDRESS')).not.toThrow();
    expect(() => validateTemplateVariable('DOMAIN_NAME')).not.toThrow();
    expect(() => validateTemplateVariable('SERVICE_PORT')).not.toThrow();
  });

  it('should reject invalid variable names', () => {
    expect(() => validateTemplateVariable('lowercase')).toThrow(ValidationError);
    expect(() => validateTemplateVariable('123INVALID')).toThrow(ValidationError);
    expect(() => validateTemplateVariable('INVALID-NAME')).toThrow(ValidationError);
    expect(() => validateTemplateVariable('')).toThrow(ValidationError);
  });

  it('should reject variable names that are too long', () => {
    const longName = 'A'.repeat(51);
    expect(() => validateTemplateVariable(longName)).toThrow(ValidationError);
  });
});

describe('Template Content Validation', () => {
  it('should validate safe template content', () => {
    const safeContent = '{"name": "{{SERVICE_NAME}}", "port": {{PORT}}}';
    expect(() => validateTemplateContent(safeContent)).not.toThrow();
  });

  it('should reject content with script injection', () => {
    expect(() => validateTemplateContent('<script>alert("xss")</script>')).toThrow(ValidationError);
    expect(() => validateTemplateContent('javascript:alert("xss")')).toThrow(ValidationError);
    expect(() => validateTemplateContent('<div onclick="malicious()"></div>')).toThrow(ValidationError);
    expect(() => validateTemplateContent('eval("malicious code")')).toThrow(ValidationError);
  });
});

describe('User Input Sanitization', () => {
  it('should sanitize user input', () => {
    expect(sanitizeUserInput('  normal input  ')).toBe('normal input');
    expect(sanitizeUserInput('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
  });

  it('should limit input length', () => {
    const longInput = 'a'.repeat(300);
    const sanitized = sanitizeUserInput(longInput, 100);
    expect(sanitized.length).toBe(100);
  });

  it('should remove control characters', () => {
    const inputWithControl = 'normal\x00\x1F\x7Finput';
    expect(sanitizeUserInput(inputWithControl)).toBe('normalinput');
  });

  it('should handle empty or invalid inputs', () => {
    expect(sanitizeUserInput('')).toBe('');
    expect(sanitizeUserInput(null as any)).toBe('');
    expect(sanitizeUserInput(undefined as any)).toBe('');
  });
});

describe('Environment Variable Validation', () => {
  it('should validate correct environment variables', () => {
    expect(() => validateEnvironmentVariable('MY_VAR', 'value')).not.toThrow();
    expect(() => validateEnvironmentVariable('SERVICE_PORT', '8080')).not.toThrow();
  });

  it('should reject invalid variable names', () => {
    expect(() => validateEnvironmentVariable('lowercase', 'value')).toThrow(ValidationError);
    expect(() => validateEnvironmentVariable('123INVALID', 'value')).toThrow(ValidationError);
    expect(() => validateEnvironmentVariable('', 'value')).toThrow(ValidationError);
  });

  it('should reject dangerous system variables', () => {
    expect(() => validateEnvironmentVariable('PATH', '/malicious/path')).toThrow(ValidationError);
    expect(() => validateEnvironmentVariable('HOME', '/tmp')).toThrow(ValidationError);
  });

  it('should reject non-string values', () => {
    expect(() => validateEnvironmentVariable('MY_VAR', 123 as any)).toThrow(ValidationError);
  });
});