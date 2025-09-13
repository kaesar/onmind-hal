/**
 * Unit tests for error handling utilities
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import {
  HomelabError,
  DistributionNotSupportedError,
  DistributionDetectionError,
  ServiceInstallationError,
  ServiceConfigurationError,
  ServiceDependencyError,
  TemplateError,
  TemplateValidationError,
  TemplateVariableError,
  ShellExecutionError,
  FileSystemError,
  ConfigurationError,
  ValidationError,
  NetworkError,
  ErrorRecoveryManager,
  ErrorHandler,
  RollbackAction,
  isRecoverableError,
  getErrorCode,
  createErrorContext,
  createServiceError,
  createTemplateError
} from '../../src/utils/errors.js';
import { ServiceType } from '../../src/core/types.js';

describe('Error Classes', () => {
  describe('HomelabError', () => {
    it('should create base error with all properties', () => {
      const context = { test: 'value' };
      const error = new HomelabError('Test message', 'TEST_CODE', true, context);

      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.recoverable).toBe(true);
      expect(error.context).toEqual(context);
      expect(error.name).toBe('HomelabError');
    });

    it('should default recoverable to false', () => {
      const error = new HomelabError('Test message', 'TEST_CODE');
      expect(error.recoverable).toBe(false);
    });

    it('should serialize to JSON correctly', () => {
      const context = { test: 'value' };
      const error = new HomelabError('Test message', 'TEST_CODE', true, context);
      const json = error.toJSON();

      expect(json.name).toBe('HomelabError');
      expect(json.message).toBe('Test message');
      expect(json.code).toBe('TEST_CODE');
      expect(json.recoverable).toBe(true);
      expect(json.context).toEqual(context);
      expect(json.stack).toBeDefined();
    });
  });

  describe('DistributionNotSupportedError', () => {
    it('should create distribution not supported error', () => {
      const error = new DistributionNotSupportedError('fedora');

      expect(error.message).toContain('fedora');
      expect(error.message).toContain('not supported');
      expect(error.code).toBe('DIST_NOT_SUPPORTED');
      expect(error.recoverable).toBe(false);
      expect(error.context?.distribution).toBe('fedora');
    });
  });

  describe('DistributionDetectionError', () => {
    it('should create distribution detection error', () => {
      const cause = 'Unable to read /etc/os-release';
      const error = new DistributionDetectionError(cause);

      expect(error.message).toContain(cause);
      expect(error.code).toBe('DIST_DETECTION_FAILED');
      expect(error.recoverable).toBe(true);
      expect(error.context?.cause).toBe(cause);
    });
  });

  describe('ServiceInstallationError', () => {
    it('should create service installation error', () => {
      const error = new ServiceInstallationError(ServiceType.CADDY, 'Docker not found');

      expect(error.message).toContain('caddy');
      expect(error.message).toContain('Docker not found');
      expect(error.code).toBe('SERVICE_INSTALL_FAILED');
      expect(error.recoverable).toBe(true);
      expect(error.context?.service).toBe(ServiceType.CADDY);
    });

    it('should allow setting recoverable to false', () => {
      const error = new ServiceInstallationError(ServiceType.CADDY, 'Critical error', false);
      expect(error.recoverable).toBe(false);
    });
  });

  describe('ServiceConfigurationError', () => {
    it('should create service configuration error', () => {
      const error = new ServiceConfigurationError(ServiceType.PORTAINER, 'Invalid config');

      expect(error.message).toContain('portainer');
      expect(error.message).toContain('Invalid config');
      expect(error.code).toBe('SERVICE_CONFIG_FAILED');
      expect(error.recoverable).toBe(true);
    });
  });

  describe('ServiceDependencyError', () => {
    it('should create service dependency error', () => {
      const error = new ServiceDependencyError(ServiceType.N8N, 'postgresql');

      expect(error.message).toContain('n8n');
      expect(error.message).toContain('postgresql');
      expect(error.code).toBe('SERVICE_DEPENDENCY_FAILED');
      expect(error.recoverable).toBe(false);
    });
  });

  describe('TemplateError', () => {
    it('should create template error', () => {
      const error = new TemplateError('caddy.json', 'Invalid JSON syntax');

      expect(error.message).toContain('caddy.json');
      expect(error.message).toContain('Invalid JSON syntax');
      expect(error.code).toBe('TEMPLATE_ERROR');
      expect(error.recoverable).toBe(false);
    });
  });

  describe('TemplateValidationError', () => {
    it('should create template validation error', () => {
      const validationErrors = ['Missing field: name', 'Invalid type: commands'];
      const error = new TemplateValidationError('service.json', validationErrors);

      expect(error.message).toContain('service.json');
      expect(error.message).toContain('Missing field: name');
      expect(error.code).toBe('TEMPLATE_VALIDATION_FAILED');
      expect(error.context?.validationErrors).toEqual(validationErrors);
    });
  });

  describe('TemplateVariableError', () => {
    it('should create template variable error', () => {
      const missingVars = ['IP', 'DOMAIN'];
      const error = new TemplateVariableError('config.json', missingVars);

      expect(error.message).toContain('config.json');
      expect(error.message).toContain('IP, DOMAIN');
      expect(error.code).toBe('TEMPLATE_VARIABLE_MISSING');
      expect(error.context?.missingVariables).toEqual(missingVars);
    });
  });

  describe('ShellExecutionError', () => {
    it('should create shell execution error', () => {
      const error = new ShellExecutionError('docker --version', 127, 'command not found');

      expect(error.message).toContain('docker --version');
      expect(error.message).toContain('127');
      expect(error.code).toBe('SHELL_EXECUTION_FAILED');
      expect(error.recoverable).toBe(true);
      expect(error.context?.exitCode).toBe(127);
      expect(error.context?.stderr).toBe('command not found');
    });
  });

  describe('FileSystemError', () => {
    it('should create filesystem error', () => {
      const error = new FileSystemError('read', '/etc/config', 'Permission denied');

      expect(error.message).toContain('read');
      expect(error.message).toContain('/etc/config');
      expect(error.message).toContain('Permission denied');
      expect(error.code).toBe('FILESYSTEM_ERROR');
      expect(error.recoverable).toBe(true);
    });
  });

  describe('ConfigurationError', () => {
    it('should create configuration error', () => {
      const error = new ConfigurationError('ip', '999.999.999.999', 'Invalid IP format');

      expect(error.message).toContain('ip');
      expect(error.message).toContain('Invalid IP format');
      expect(error.code).toBe('CONFIG_INVALID');
      expect(error.recoverable).toBe(false);
      expect(error.context?.field).toBe('ip');
      expect(error.context?.value).toBe('999.999.999.999');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error = new ValidationError('domain', '', 'Domain cannot be empty');

      expect(error.message).toContain('domain');
      expect(error.message).toContain('Domain cannot be empty');
      expect(error.code).toBe('VALIDATION_FAILED');
      expect(error.recoverable).toBe(false);
    });
  });

  describe('NetworkError', () => {
    it('should create network error', () => {
      const error = new NetworkError('download', 'docker.io', 'Connection timeout');

      expect(error.message).toContain('download');
      expect(error.message).toContain('docker.io');
      expect(error.message).toContain('Connection timeout');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.recoverable).toBe(true);
    });
  });
});

describe('ErrorRecoveryManager', () => {
  let recoveryManager: ErrorRecoveryManager;

  beforeEach(() => {
    recoveryManager = new ErrorRecoveryManager();
  });

  it('should add rollback actions', () => {
    const action: RollbackAction = {
      description: 'Test rollback',
      execute: mock(() => Promise.resolve())
    };

    recoveryManager.addRollbackAction(action);
    expect(recoveryManager.hasActions()).toBe(true);
  });

  it('should execute rollback actions in reverse order', async () => {
    const executionOrder: number[] = [];
    
    const action1: RollbackAction = {
      description: 'First action',
      execute: mock(() => {
        executionOrder.push(1);
        return Promise.resolve();
      })
    };
    
    const action2: RollbackAction = {
      description: 'Second action',
      execute: mock(() => {
        executionOrder.push(2);
        return Promise.resolve();
      })
    };

    recoveryManager.addRollbackAction(action1);
    recoveryManager.addRollbackAction(action2);

    await recoveryManager.executeRollback();

    expect(executionOrder).toEqual([2, 1]);
    expect(action1.execute).toHaveBeenCalled();
    expect(action2.execute).toHaveBeenCalled();
    expect(recoveryManager.hasActions()).toBe(false);
  });

  it('should continue rollback even if one action fails', async () => {
    const action1: RollbackAction = {
      description: 'Failing action',
      execute: mock(() => Promise.reject(new Error('Rollback failed')))
    };
    
    const action2: RollbackAction = {
      description: 'Success action',
      execute: mock(() => Promise.resolve())
    };

    recoveryManager.addRollbackAction(action1);
    recoveryManager.addRollbackAction(action2);

    await recoveryManager.executeRollback();

    expect(action1.execute).toHaveBeenCalled();
    expect(action2.execute).toHaveBeenCalled();
  });

  it('should clear actions', () => {
    const action: RollbackAction = {
      description: 'Test action',
      execute: mock(() => Promise.resolve())
    };

    recoveryManager.addRollbackAction(action);
    expect(recoveryManager.hasActions()).toBe(true);

    recoveryManager.clear();
    expect(recoveryManager.hasActions()).toBe(false);
  });
});

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
    errorHandler.getRecoveryManager().clear();
  });

  it('should be singleton', () => {
    const handler1 = ErrorHandler.getInstance();
    const handler2 = ErrorHandler.getInstance();
    expect(handler1).toBe(handler2);
  });

  it('should handle HomelabError with recovery', async () => {
    const recoveryManager = errorHandler.getRecoveryManager();
    const rollbackAction: RollbackAction = {
      description: 'Test rollback',
      execute: mock(() => Promise.resolve())
    };
    
    recoveryManager.addRollbackAction(rollbackAction);
    
    const error = new ServiceInstallationError(ServiceType.CADDY, 'Test error', true);
    
    await errorHandler.handleError(error);
    
    expect(rollbackAction.execute).toHaveBeenCalled();
  });

  it('should handle non-recoverable errors without rollback', async () => {
    const recoveryManager = errorHandler.getRecoveryManager();
    const rollbackAction: RollbackAction = {
      description: 'Test rollback',
      execute: mock(() => Promise.resolve())
    };
    
    recoveryManager.addRollbackAction(rollbackAction);
    
    const error = new DistributionNotSupportedError('unsupported');
    
    await errorHandler.handleError(error);
    
    expect(rollbackAction.execute).not.toHaveBeenCalled();
  });

  it('should handle regular errors', async () => {
    const error = new Error('Regular error');
    
    // Should not throw
    await errorHandler.handleError(error);
  });
});

describe('Utility Functions', () => {
  describe('isRecoverableError', () => {
    it('should return true for recoverable HomelabError', () => {
      const error = new ServiceInstallationError(ServiceType.CADDY, 'Test', true);
      expect(isRecoverableError(error)).toBe(true);
    });

    it('should return false for non-recoverable HomelabError', () => {
      const error = new DistributionNotSupportedError('test');
      expect(isRecoverableError(error)).toBe(false);
    });

    it('should return false for regular Error', () => {
      const error = new Error('Regular error');
      expect(isRecoverableError(error)).toBe(false);
    });
  });

  describe('getErrorCode', () => {
    it('should return code for HomelabError', () => {
      const error = new ServiceInstallationError(ServiceType.CADDY, 'Test');
      expect(getErrorCode(error)).toBe('SERVICE_INSTALL_FAILED');
    });

    it('should return UNKNOWN_ERROR for regular Error', () => {
      const error = new Error('Regular error');
      expect(getErrorCode(error)).toBe('UNKNOWN_ERROR');
    });
  });

  describe('createErrorContext', () => {
    it('should create context with timestamp', () => {
      const context = createErrorContext({ test: 'value' });
      
      expect(context.test).toBe('value');
      expect(context.timestamp).toBeDefined();
      expect(typeof context.timestamp).toBe('string');
    });
  });

  describe('createServiceError', () => {
    it('should create installation error', () => {
      const error = createServiceError(ServiceType.CADDY, 'install', 'Docker not found');
      
      expect(error).toBeInstanceOf(ServiceInstallationError);
      expect(error.code).toBe('SERVICE_INSTALL_FAILED');
    });

    it('should create configuration error', () => {
      const error = createServiceError(ServiceType.CADDY, 'configure', 'Invalid config');
      
      expect(error).toBeInstanceOf(ServiceConfigurationError);
      expect(error.code).toBe('SERVICE_CONFIG_FAILED');
    });

    it('should create start error', () => {
      const error = createServiceError(ServiceType.CADDY, 'start', 'Port in use');
      
      expect(error).toBeInstanceOf(ServiceInstallationError);
      expect(error.message).toContain('Failed to start');
    });
  });

  describe('createTemplateError', () => {
    it('should create load error', () => {
      const error = createTemplateError('test.json', 'load', 'File not found');
      
      expect(error).toBeInstanceOf(TemplateError);
      expect(error.code).toBe('TEMPLATE_ERROR');
    });

    it('should create validation error', () => {
      const error = createTemplateError('test.json', 'validate', ['Missing field']);
      
      expect(error).toBeInstanceOf(TemplateValidationError);
      expect(error.code).toBe('TEMPLATE_VALIDATION_FAILED');
    });

    it('should create render error', () => {
      const error = createTemplateError('test.json', 'render', ['Missing variable']);
      
      expect(error).toBeInstanceOf(TemplateVariableError);
      expect(error.code).toBe('TEMPLATE_VARIABLE_MISSING');
    });
  });
});