/**
 * Integration tests for complete CLI interaction flow
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { CLIInterface } from '../../src/cli/interface.js';
import { ServiceType } from '../../src/core/types.js';
import { HomelabError } from '../../src/utils/errors.js';

// Mock inquirer module
const mockInquirer = {
  prompt: mock(() => Promise.resolve({}))
};

// Mock the prompts module
const mockPrompts = {
  collectUserConfiguration: mock(() => Promise.resolve({})),
  promptForConfirmation: mock(() => Promise.resolve(true))
};

describe('CLI Interface Integration', () => {
  let cli: CLIInterface;
  let consoleSpy: any;

  beforeEach(() => {
    cli = new CLIInterface();
    consoleSpy = {
      log: mock(() => {}),
      error: mock(() => {})
    };
    
    // Replace console methods
    global.console.log = consoleSpy.log;
    global.console.error = consoleSpy.error;
  });

  describe('Configuration Collection', () => {
    it('should collect and validate complete configuration', () => {
      const mockConfig = {
        ip: '192.168.1.100',
        domain: 'homelab.local',
        networkName: 'homelab-network',
        selectedServices: [ServiceType.CADDY, ServiceType.PORTAINER, ServiceType.COPYPARTY],
        databasePassword: undefined
      };

      cli.setConfig(mockConfig);
      const result = cli.getConfig();

      expect(result.ip).toBe('192.168.1.100');
      expect(result.domain).toBe('homelab.local');
      expect(result.networkName).toBe('homelab-network');
      expect(result.selectedServices).toEqual([
        ServiceType.CADDY,
        ServiceType.PORTAINER,
        ServiceType.COPYPARTY
      ]);
    });

    it('should handle configuration with optional services', () => {
      const mockConfig = {
        ip: '10.0.0.1',
        domain: 'example.com',
        networkName: 'my-network',
        selectedServices: [
          ServiceType.CADDY,
          ServiceType.PORTAINER,
          ServiceType.COPYPARTY,
          ServiceType.N8N,
          ServiceType.POSTGRESQL,
          //ServiceType.REDIS,
          //ServiceType.MONGODB,
          //ServiceType.MARIADB,
          //ServiceType.MINIO,
          //ServiceType.OLLAMA,
        ],
        databasePassword: 'securepassword123'
      };

      cli.setConfig(mockConfig);
      const result = cli.getConfig();

      expect(result.selectedServices).toContain(ServiceType.N8N);
      expect(result.selectedServices).toContain(ServiceType.POSTGRESQL);
      expect(result.databasePassword).toBe('securepassword123');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate required fields are present', () => {
      const incompleteConfig = {
        ip: '192.168.1.100',
        // Missing domain, networkName, selectedServices
      };

      cli.setConfig(incompleteConfig);

      expect(() => {
        // Access private method through any cast for testing
        (cli as any).validateAndCompleteConfig();
      }).toThrow();
    });

    it('should validate IP address format through CLI flow', () => {
      const configWithInvalidIP = {
        ip: '', // Invalid IP
        domain: 'homelab.local',
        networkName: 'homelab-network',
        selectedServices: [ServiceType.CADDY]
      };

      cli.setConfig(configWithInvalidIP);

      expect(() => {
        (cli as any).validateAndCompleteConfig();
      }).toThrow();
    });

    it('should validate at least one service is selected', () => {
      const configWithoutServices = {
        ip: '192.168.1.100',
        domain: 'homelab.local',
        networkName: 'homelab-network',
        selectedServices: [] // No services selected
      };

      cli.setConfig(configWithoutServices);

      expect(() => {
        (cli as any).validateAndCompleteConfig();
      }).toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle HomelabError correctly', () => {
      const error = new HomelabError('Test error', 'TEST_ERROR');
      
      (cli as any).handleError(error);

      expect(consoleSpy.error).toHaveBeenCalledWith('\n❌ An error occurred during configuration:');
      expect(consoleSpy.error).toHaveBeenCalledWith('Error: Test error');
      expect(consoleSpy.error).toHaveBeenCalledWith('Code: TEST_ERROR');
    });

    it('should handle generic Error correctly', () => {
      const error = new Error('Generic error');
      
      (cli as any).handleError(error);

      expect(consoleSpy.error).toHaveBeenCalledWith('\n❌ An error occurred during configuration:');
      expect(consoleSpy.error).toHaveBeenCalledWith('Error: Generic error');
    });

    it('should handle unknown error correctly', () => {
      const error = 'String error';
      
      (cli as any).handleError(error);

      expect(consoleSpy.error).toHaveBeenCalledWith('\n❌ An error occurred during configuration:');
      expect(consoleSpy.error).toHaveBeenCalledWith('Unknown error occurred');
    });
  });

  describe('Configuration Display', () => {
    it('should display configuration summary correctly', async () => {
      const mockConfig = {
        ip: '192.168.1.100',
        domain: 'homelab.local',
        networkName: 'homelab-network',
        selectedServices: [
          ServiceType.CADDY,
          ServiceType.PORTAINER,
          ServiceType.COPYPARTY,
          ServiceType.N8N
        ],
        databasePassword: undefined
      };

      cli.setConfig(mockConfig);
      await (cli as any).displayConfigurationSummary();

      expect(consoleSpy.log).toHaveBeenCalledWith('\n📋 Configuration Summary:');
      expect(consoleSpy.log).toHaveBeenCalledWith('🌐 Server IP: 192.168.1.100');
      expect(consoleSpy.log).toHaveBeenCalledWith('🏷️  Domain: homelab.local');
      expect(consoleSpy.log).toHaveBeenCalledWith('🔗 Network: homelab-network');
    });

    it('should display PostgreSQL password status when configured', async () => {
      const mockConfig = {
        ip: '192.168.1.100',
        domain: 'homelab.local',
        networkName: 'homelab-network',
        selectedServices: [ServiceType.CADDY, ServiceType.POSTGRESQL],
        databasePassword: 'secret123'
      };

      cli.setConfig(mockConfig);
      await (cli as any).displayConfigurationSummary();

      expect(consoleSpy.log).toHaveBeenCalledWith('   🔐 Database password: [CONFIGURED]');
    });
  });

  describe('Service Display Names', () => {
    it('should return correct display names for services', () => {
      expect((cli as any).getServiceDisplayName('caddy')).toBe('Caddy (Reverse Proxy)');
      expect((cli as any).getServiceDisplayName('portainer')).toBe('Portainer (Docker Management)');
      expect((cli as any).getServiceDisplayName('copyparty')).toBe('Copyparty (File Sharing)');
      expect((cli as any).getServiceDisplayName('n8n')).toBe('n8n (Workflow Automation)');
      expect((cli as any).getServiceDisplayName('postgresql')).toBe('PostgreSQL (Database)');
      expect((cli as any).getServiceDisplayName('redis')).toBe('Redis (Cache/Queue)');
      expect((cli as any).getServiceDisplayName('unknown')).toBe('unknown');
    });
  });
});