/**
 * Input validation and security utilities for HomeLab application
 */

import { ServiceType, DistributionType, HomelabConfig } from '../core/types.js';
import { ValidationError, ConfigurationError } from './errors.js';

// Regular expressions for validation
const IP_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
const NETWORK_NAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/;
const PASSWORD_REGEX = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;
const FILE_PATH_REGEX = /^[a-zA-Z0-9._\-\/]+$/;
const COMMAND_SAFE_REGEX = /^[a-zA-Z0-9._\-\/\s=:@]+$/;

// Dangerous characters and patterns for shell injection prevention
const SHELL_INJECTION_PATTERNS = [
  /[;&|`$(){}[\]<>]/,  // Shell metacharacters
  /\$\(/,              // Command substitution
  /`[^`]*`/,           // Backtick command substitution
  /\|\s*\w/,           // Pipe to command
  /&&|\|\|/,           // Command chaining
  />\s*\/|<\s*\//,     // File redirection
];

const DANGEROUS_COMMANDS = [
  'rm', 'rmdir', 'del', 'delete', 'format', 'fdisk',
  'mkfs', 'dd', 'shutdown', 'reboot', 'halt', 'init',
  'kill', 'killall', 'pkill', 'sudo', 'su', 'chmod',
  'chown', 'passwd', 'useradd', 'userdel', 'groupadd',
  'groupdel', 'mount', 'umount', 'crontab', 'at'
];

/**
 * Validates IP address format
 */
export function validateIP(ip: string): void {
  if (!ip || typeof ip !== 'string') {
    throw new ValidationError('ip', ip, 'IP address must be a non-empty string');
  }

  if (!IP_REGEX.test(ip.trim())) {
    throw new ValidationError('ip', ip, 'Invalid IP address format. Expected format: xxx.xxx.xxx.xxx');
  }

  // Additional validation for private IP ranges
  const parts = ip.trim().split('.').map(Number);
  if (parts.some(part => part < 0 || part > 255)) {
    throw new ValidationError('ip', ip, 'IP address octets must be between 0 and 255');
  }

  // Warn about public IP addresses (not blocking, just validation)
  const isPrivate = (
    (parts[0] === 10) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );

  if (!isPrivate) {
    // Not throwing error, but could be logged as warning
    console.warn(`Warning: ${ip} appears to be a public IP address`);
  }
}

/**
 * Validates domain name format
 */
export function validateDomain(domain: string): void {
  if (!domain || typeof domain !== 'string') {
    throw new ValidationError('domain', domain, 'Domain must be a non-empty string');
  }

  const trimmedDomain = domain.trim();
  
  if (trimmedDomain.length === 0) {
    throw new ValidationError('domain', domain, 'Domain cannot be empty');
  }

  if (trimmedDomain.length > 253) {
    throw new ValidationError('domain', domain, 'Domain name too long (max 253 characters)');
  }

  if (!DOMAIN_REGEX.test(trimmedDomain)) {
    throw new ValidationError('domain', domain, 'Invalid domain format. Use lowercase letters, numbers, dots, and hyphens only');
  }

  // Check for consecutive dots
  if (trimmedDomain.includes('..')) {
    throw new ValidationError('domain', domain, 'Domain cannot contain consecutive dots');
  }

  // Check if starts or ends with dot or hyphen
  if (trimmedDomain.startsWith('.') || trimmedDomain.endsWith('.') || 
      trimmedDomain.startsWith('-') || trimmedDomain.endsWith('-')) {
    throw new ValidationError('domain', domain, 'Domain cannot start or end with dot or hyphen');
  }
}

/**
 * Validates network name format
 */
export function validateNetworkName(networkName: string): void {
  if (!networkName || typeof networkName !== 'string') {
    throw new ValidationError('networkName', networkName, 'Network name must be a non-empty string');
  }

  const trimmedName = networkName.trim();
  
  if (trimmedName.length === 0) {
    throw new ValidationError('networkName', networkName, 'Network name cannot be empty');
  }

  if (trimmedName.length > 63) {
    throw new ValidationError('networkName', networkName, 'Network name too long (max 63 characters)');
  }

  if (!NETWORK_NAME_REGEX.test(trimmedName)) {
    throw new ValidationError('networkName', networkName, 'Invalid network name. Use letters, numbers, underscores, dots, and hyphens only');
  }

  // Docker network name restrictions
  if (trimmedName.startsWith('-') || trimmedName.endsWith('-')) {
    throw new ValidationError('networkName', networkName, 'Network name cannot start or end with hyphen');
  }
}

/**
 * Validates database password (PostgreSQL/MariaDB)
 */
export function validateStoragePassword(password: string): void {
  if (!password || typeof password !== 'string') {
    throw new ValidationError('storagePassword', password, 'Password must be a non-empty string');
  }

  if (password.length < 8) {
    throw new ValidationError('storagePassword', password, 'Password must be at least 8 characters long');
  }

  if (password.length > 128) {
    throw new ValidationError('storagePassword', password, 'Password too long (max 128 characters)');
  }

  if (!PASSWORD_REGEX.test(password)) {
    throw new ValidationError('storagePassword', password, 'Password contains invalid characters. Use letters, numbers, and common symbols only');
  }

  // Check for common weak passwords
  const weakPasswords = ['password', '12345678', 'admin123', 'postgres'];
  if (weakPasswords.includes(password.toLowerCase())) {
    throw new ValidationError('storagePassword', password, 'Password is too common. Please choose a stronger password');
  }
}

/**
 * Validates PostgreSQL password (alias for backward compatibility)
 */
export function validatePostgresPassword(password: string): void {
  validateStoragePassword(password);
}

/**
 * Validates service selection
 */
export function validateServiceSelection(services: ServiceType[]): void {
  if (!Array.isArray(services)) {
    throw new ValidationError('selectedServices', services, 'Selected services must be an array');
  }

  // Check for valid service types
  const validServices = Object.values(ServiceType);
  for (const service of services) {
    if (!validServices.includes(service)) {
      throw new ValidationError('selectedServices', service, `Invalid service type: ${service}`);
    }
  }

  // Check for duplicates
  const uniqueServices = new Set(services);
  if (uniqueServices.size !== services.length) {
    throw new ValidationError('selectedServices', services, 'Duplicate services found in selection');
  }

  // Validate service dependencies
  validateServiceDependencies(services);
}

/**
 * Validates service dependencies
 */
export function validateServiceDependencies(services: ServiceType[]): void {
  const serviceSet = new Set(services);

  // N8N requires PostgreSQL
  if (serviceSet.has(ServiceType.N8N) && !serviceSet.has(ServiceType.POSTGRESQL)) {
    throw new ValidationError('selectedServices', services, 'N8N service requires PostgreSQL to be selected');
  }

  // Core services validation (Caddy, Portainer, Copyparty should always be included)
  const coreServices = [ServiceType.CADDY, ServiceType.PORTAINER, ServiceType.COPYPARTY];
  for (const coreService of coreServices) {
    if (!serviceSet.has(coreService)) {
      throw new ValidationError('selectedServices', services, `Core service ${coreService} must be included`);
    }
  }
}

/**
 * Validates distribution type
 */
export function validateDistribution(distribution: DistributionType): void {
  const validDistributions = Object.values(DistributionType);
  if (!validDistributions.includes(distribution)) {
    throw new ValidationError('distribution', distribution, `Invalid distribution type: ${distribution}`);
  }
}

/**
 * Validates complete HomeLab configuration
 */
export function validateHomelabConfig(config: HomelabConfig): void {
  if (!config || typeof config !== 'object') {
    throw new ConfigurationError('config', config, 'Configuration must be an object');
  }

  validateIP(config.ip);
  validateDomain(config.domain);
  validateNetworkName(config.networkName);
  validateServiceSelection(config.selectedServices);
  validateDistribution(config.distribution);

  if (config.storagePassword !== undefined) {
    validateStoragePassword(config.storagePassword);
  }

  // If PostgreSQL or MariaDB is selected, password is required
  if ((config.selectedServices.includes(ServiceType.POSTGRESQL) || config.selectedServices.includes(ServiceType.MARIADB)) && !config.storagePassword) {
    throw new ConfigurationError('storagePassword', config.storagePassword, 'Storage password is required when PostgreSQL or MariaDB service are selected');
  }
}

/**
 * Validates file path for security
 */
export function validateFilePath(filePath: string): void {
  if (!filePath || typeof filePath !== 'string') {
    throw new ValidationError('filePath', filePath, 'File path must be a non-empty string');
  }

  const trimmedPath = filePath.trim();
  
  if (trimmedPath.length === 0) {
    throw new ValidationError('filePath', filePath, 'File path cannot be empty');
  }

  // Check for path traversal attempts
  if (trimmedPath.includes('..')) {
    throw new ValidationError('filePath', filePath, 'File path cannot contain parent directory references (..)');
  }

  // Check for absolute paths outside allowed directories
  if (trimmedPath.startsWith('/') && !trimmedPath.startsWith('/tmp/') && !trimmedPath.startsWith('/var/')) {
    throw new ValidationError('filePath', filePath, 'Absolute paths outside /tmp and /var are not allowed');
  }

  // Basic character validation
  if (!FILE_PATH_REGEX.test(trimmedPath)) {
    throw new ValidationError('filePath', filePath, 'File path contains invalid characters');
  }
}

/**
 * Sanitizes shell command parameters to prevent injection
 */
export function sanitizeShellParameter(parameter: string): string {
  if (!parameter || typeof parameter !== 'string') {
    throw new ValidationError('shellParameter', parameter, 'Shell parameter must be a string');
  }

  // Remove dangerous characters
  let sanitized = parameter.trim();
  
  // Check for shell injection patterns
  for (const pattern of SHELL_INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      throw new ValidationError('shellParameter', parameter, 'Shell parameter contains potentially dangerous characters');
    }
  }

  // Escape special characters that might be legitimate
  sanitized = sanitized.replace(/'/g, "\\'");
  sanitized = sanitized.replace(/"/g, '\\"');
  
  return sanitized;
}

/**
 * Validates shell command for security
 */
export function validateShellCommand(command: string): void {
  if (!command || typeof command !== 'string') {
    throw new ValidationError('shellCommand', command, 'Shell command must be a non-empty string');
  }

  const trimmedCommand = command.trim();
  
  if (trimmedCommand.length === 0) {
    throw new ValidationError('shellCommand', command, 'Shell command cannot be empty');
  }

  // Check for dangerous commands
  const commandParts = trimmedCommand.split(/\s+/);
  const baseCommand = commandParts[0].toLowerCase();
  
  if (DANGEROUS_COMMANDS.includes(baseCommand)) {
    throw new ValidationError('shellCommand', command, `Dangerous command detected: ${baseCommand}`);
  }

  // Check for shell injection patterns
  for (const pattern of SHELL_INJECTION_PATTERNS) {
    if (pattern.test(trimmedCommand)) {
      throw new ValidationError('shellCommand', command, 'Shell command contains potentially dangerous patterns');
    }
  }

  // Additional validation for allowed commands
  const allowedCommands = [
    'docker', 'apt', 'apt-get', 'pacman', 'yum', 'dnf',
    'systemctl', 'curl', 'wget', 'git', 'npm', 'node',
    'bun', 'echo', 'cat', 'ls', 'mkdir', 'cp', 'mv',
    'which', 'whereis', 'uname', 'lsb_release', 'pwd',
    'printenv', 'sleep', 'false', 'true', 'test'
  ];

  if (!allowedCommands.includes(baseCommand)) {
    throw new ValidationError('shellCommand', command, `Command not in allowed list: ${baseCommand}`);
  }
}

/**
 * Validates template variable name
 */
export function validateTemplateVariable(variableName: string): void {
  if (!variableName || typeof variableName !== 'string') {
    throw new ValidationError('templateVariable', variableName, 'Template variable name must be a non-empty string');
  }

  const trimmedName = variableName.trim();
  
  if (trimmedName.length === 0) {
    throw new ValidationError('templateVariable', variableName, 'Template variable name cannot be empty');
  }

  // Variable names should be alphanumeric with underscores
  if (!/^[A-Z_][A-Z0-9_]*$/.test(trimmedName)) {
    throw new ValidationError('templateVariable', variableName, 'Template variable name must be uppercase letters, numbers, and underscores only');
  }

  if (trimmedName.length > 50) {
    throw new ValidationError('templateVariable', variableName, 'Template variable name too long (max 50 characters)');
  }
}

/**
 * Validates template content for security
 */
export function validateTemplateContent(content: string): void {
  if (!content || typeof content !== 'string') {
    throw new ValidationError('templateContent', content, 'Template content must be a non-empty string');
  }

  // Check for potential script injection in templates
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,  // Event handlers like onclick=
    /eval\s*\(/i,
    /Function\s*\(/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(content)) {
      throw new ValidationError('templateContent', content, 'Template content contains potentially dangerous script patterns');
    }
  }
}

/**
 * Comprehensive input sanitization for user inputs
 */
export function sanitizeUserInput(input: string, maxLength: number = 255): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input.trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Remove or escape HTML-like content
  sanitized = sanitized.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  return sanitized;
}

/**
 * Validates environment variable name
 */
export function validateEnvironmentVariable(name: string, value: string): void {
  if (!name || typeof name !== 'string') {
    throw new ValidationError('envVarName', name, 'Environment variable name must be a non-empty string');
  }

  if (!/^[A-Z_][A-Z0-9_]*$/.test(name)) {
    throw new ValidationError('envVarName', name, 'Environment variable name must be uppercase letters, numbers, and underscores only');
  }

  if (value !== undefined && typeof value !== 'string') {
    throw new ValidationError('envVarValue', value, 'Environment variable value must be a string');
  }

  // Check for dangerous environment variables
  const dangerousEnvVars = ['PATH', 'LD_LIBRARY_PATH', 'HOME', 'USER', 'SHELL'];
  if (dangerousEnvVars.includes(name)) {
    throw new ValidationError('envVarName', name, `Cannot override system environment variable: ${name}`);
  }
}