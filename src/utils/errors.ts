/**
 * Comprehensive error handling utilities for HomeLab application
 */

import { ServiceType, DistributionType } from '../core/types.js';
import { logger } from './logger.js';

// Base error class
export class HomelabError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = false,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'HomelabError';
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      recoverable: this.recoverable,
      context: this.context,
      stack: this.stack
    };
  }
}

// Distribution-related errors
export class DistributionNotSupportedError extends HomelabError {
  constructor(distribution: string) {
    super(
      `Distribution ${distribution} is not supported. Supported distributions: Ubuntu, Arch Linux, Amazon Linux 2023`,
      'DIST_NOT_SUPPORTED',
      false,
      { distribution }
    );
  }
}

export class DistributionDetectionError extends HomelabError {
  constructor(cause: string) {
    super(
      `Failed to detect Linux distribution: ${cause}`,
      'DIST_DETECTION_FAILED',
      true,
      { cause }
    );
  }
}

// Service-related errors
export class ServiceInstallationError extends HomelabError {
  constructor(service: ServiceType, cause: string, recoverable: boolean = true) {
    super(
      `Failed to install ${service}: ${cause}`,
      'SERVICE_INSTALL_FAILED',
      recoverable,
      { service, cause }
    );
  }
}

export class ServiceConfigurationError extends HomelabError {
  constructor(service: ServiceType, cause: string) {
    super(
      `Failed to configure ${service}: ${cause}`,
      'SERVICE_CONFIG_FAILED',
      true,
      { service, cause }
    );
  }
}

export class ServiceDependencyError extends HomelabError {
  constructor(service: ServiceType, dependency: string) {
    super(
      `Service ${service} requires ${dependency} but it's not available`,
      'SERVICE_DEPENDENCY_FAILED',
      false,
      { service, dependency }
    );
  }
}

// Template-related errors
export class TemplateError extends HomelabError {
  constructor(template: string, cause: string) {
    super(
      `Template error in ${template}: ${cause}`,
      'TEMPLATE_ERROR',
      false,
      { template, cause }
    );
  }
}

export class TemplateValidationError extends HomelabError {
  constructor(template: string, validationErrors: string[]) {
    super(
      `Template validation failed for ${template}: ${validationErrors.join(', ')}`,
      'TEMPLATE_VALIDATION_FAILED',
      false,
      { template, validationErrors }
    );
  }
}

export class TemplateVariableError extends HomelabError {
  constructor(template: string, missingVariables: string[]) {
    super(
      `Missing required variables in template ${template}: ${missingVariables.join(', ')}`,
      'TEMPLATE_VARIABLE_MISSING',
      false,
      { template, missingVariables }
    );
  }
}

// Shell and system errors
export class ShellExecutionError extends HomelabError {
  constructor(command: string, exitCode: number, stderr: string) {
    super(
      `Shell command failed: ${command} (exit code: ${exitCode})`,
      'SHELL_EXECUTION_FAILED',
      true,
      { command, exitCode, stderr }
    );
  }
}

export class FileSystemError extends HomelabError {
  constructor(operation: string, path: string, cause: string) {
    super(
      `File system operation failed: ${operation} on ${path} - ${cause}`,
      'FILESYSTEM_ERROR',
      true,
      { operation, path, cause }
    );
  }
}

// Configuration errors
export class ConfigurationError extends HomelabError {
  constructor(field: string, value: any, reason: string) {
    super(
      `Invalid configuration for ${field}: ${reason}`,
      'CONFIG_INVALID',
      false,
      { field, value, reason }
    );
  }
}

export class ValidationError extends HomelabError {
  constructor(field: string, value: any, constraint: string) {
    super(
      `Validation failed for ${field}: ${constraint}`,
      'VALIDATION_FAILED',
      false,
      { field, value, constraint }
    );
  }
}

// Network and connectivity errors
export class NetworkError extends HomelabError {
  constructor(operation: string, target: string, cause: string) {
    super(
      `Network operation failed: ${operation} to ${target} - ${cause}`,
      'NETWORK_ERROR',
      true,
      { operation, target, cause }
    );
  }
}

// Error recovery and rollback mechanisms
export interface RollbackAction {
  description: string;
  execute(): Promise<void>;
}

export class ErrorRecoveryManager {
  private rollbackActions: RollbackAction[] = [];

  addRollbackAction(action: RollbackAction): void {
    this.rollbackActions.push(action);
  }

  async executeRollback(): Promise<void> {
    logger.warn('Executing rollback actions...');
    
    // Execute rollback actions in reverse order
    for (let i = this.rollbackActions.length - 1; i >= 0; i--) {
      const action = this.rollbackActions[i];
      try {
        logger.info(`Executing rollback: ${action.description}`);
        await action.execute();
      } catch (error) {
        logger.error(`Rollback action failed: ${action.description}`, error);
        // Continue with other rollback actions even if one fails
      }
    }
    
    this.rollbackActions = [];
    logger.info('Rollback completed');
  }

  clear(): void {
    this.rollbackActions = [];
  }

  hasActions(): boolean {
    return this.rollbackActions.length > 0;
  }
}

// Global error handler
export class ErrorHandler {
  private static instance: ErrorHandler;
  private recoveryManager = new ErrorRecoveryManager();

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  async handleError(error: Error): Promise<void> {
    if (error instanceof HomelabError) {
      logger.error(`HomeLab Error [${error.code}]: ${error.message}`, {
        code: error.code,
        recoverable: error.recoverable,
        context: error.context
      });

      if (error.recoverable && this.recoveryManager.hasActions()) {
        logger.info('Attempting error recovery...');
        await this.recoveryManager.executeRollback();
      }
    } else {
      logger.error('Unexpected error:', error);
    }
  }

  getRecoveryManager(): ErrorRecoveryManager {
    return this.recoveryManager;
  }

  async gracefulShutdown(error: Error): Promise<void> {
    logger.error('Fatal error occurred, initiating graceful shutdown:', error);
    
    if (this.recoveryManager.hasActions()) {
      await this.recoveryManager.executeRollback();
    }
    
    process.exit(1);
  }
}

// Utility functions for error handling
export function isRecoverableError(error: Error): boolean {
  return error instanceof HomelabError && error.recoverable;
}

export function getErrorCode(error: Error): string {
  if (error instanceof HomelabError) {
    return error.code;
  }
  return 'UNKNOWN_ERROR';
}

export function createErrorContext(context: Record<string, any>): Record<string, any> {
  return {
    timestamp: new Date().toISOString(),
    ...context
  };
}

// Error factory functions
export function createServiceError(
  service: ServiceType,
  operation: 'install' | 'configure' | 'start',
  cause: string,
  recoverable: boolean = true
): HomelabError {
  switch (operation) {
    case 'install':
      return new ServiceInstallationError(service, cause, recoverable);
    case 'configure':
      return new ServiceConfigurationError(service, cause);
    case 'start':
      return new ServiceInstallationError(service, `Failed to start: ${cause}`, recoverable);
    default:
      return new HomelabError(`Service ${operation} failed for ${service}: ${cause}`, 'SERVICE_ERROR', recoverable);
  }
}

export function createTemplateError(
  template: string,
  type: 'load' | 'validate' | 'render',
  details: string | string[]
): HomelabError {
  switch (type) {
    case 'load':
      return new TemplateError(template, details as string);
    case 'validate':
      return new TemplateValidationError(template, Array.isArray(details) ? details : [details]);
    case 'render':
      return new TemplateVariableError(template, Array.isArray(details) ? details : [details]);
    default:
      return new TemplateError(template, Array.isArray(details) ? details.join(', ') : details);
  }
}