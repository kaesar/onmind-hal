/**
 * Unit tests for CLI interface class
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { CLIInterface } from '../../../src/cli/interface.js';
import { ServiceType, HomelabError } from '../../../src/core/types.js';

describe('CLI Interface Unit Tests', () => {
  let cli: CLIInterface;

  beforeEach(() => {
    cli = new CLIInterface();
  });

  describe('Configuration Management', () => {
    it('should set and get configuration correctly', () => {
      const testConfig = {
        ip: '192.168.1.100',
        domain: 'test.local',
        networkName: 'test-network',
        selectedServices: [ServiceType.CADDY]
      };

      cli.setConfig(testConfig);
      const result = cli.getConfig();

      expect(result).toEqual(testConfig);
    });

    it('should handle empty configuration', () => {
      const result = cli.getConfig();
      expect(result).toEqual({});
    });

    it('should overwrite existing configuration when setting new config', () => {
      const firstConfig = {
        ip: '192.168.1.100',
        domain: 'first.local'
      };

      const secondConfig = {
        ip: '10.0.0.1',
        domain: 'second.local',
        networkName: 'new-network'
      };

      cli.setConfig(firstConfig);
      cli.setConfig(secondConfig);
      
      const result = cli.getConfig();
      expect(result).toEqual(secondConfig);
    });
  });

  describe('Service Display Names', () => {
    it('should return correct display names for all supported services', () => {
      const testCases = [
        { service: 'caddy', expected: 'Caddy (Reverse Proxy)' },
        { service: 'portainer', expected: 'Portainer (Docker Management)' },
        { service: 'copyparty', expected: 'Copyparty (File Sharing)' },
        { service: 'n8n', expected: 'n8n (Workflow Automation)' },
        { service: 'postgresql', expected: 'PostgreSQL (Database)' },
        { service: 'redis', expected: 'Redis (Cache/Queue)' }
      ];

      testCases.forEach(({ service, expected }) => {
        const result = (cli as any).getServiceDisplayName(service);
        expect(result).toBe(expected);
      });
    });

    it('should return the service name as-is for unknown services', () => {
      const unknownService = 'unknown-service';
      const result = (cli as any).getServiceDisplayName(unknownService);
      expect(result).toBe(unknownService);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate complete valid configuration', () => {
      const validConfig = {
        ip: '192.168.1.100',
        domain: 'homelab.local',
        networkName: 'homelab-network',
        selectedServices: [ServiceType.CADDY, ServiceType.PORTAINER]
      };

      cli.setConfig(validConfig);
      
      expect(() => {
        (cli as any).validateAndCompleteConfig();
      }).not.toThrow();
    });

    it('should throw error for missing IP', () => {
      const invalidConfig = {
        domain: 'homelab.local',
        networkName: 'homelab-network',
        selectedServices: [ServiceType.CADDY]
      };

      cli.setConfig(invalidConfig);
      
      expect(() => {
        (cli as any).validateAndCompleteConfig();
      }).toThrow('IP address is required');
    });

    it('should throw error for missing domain', () => {
      const invalidConfig = {
        ip: '192.168.1.100',
        networkName: 'homelab-network',
        selectedServices: [ServiceType.CADDY]
      };

      cli.setConfig(invalidConfig);
      
      expect(() => {
        (cli as any).validateAndCompleteConfig();
      }).toThrow('Domain is required');
    });

    it('should throw error for missing network name', () => {
      const invalidConfig = {
        ip: '192.168.1.100',
        domain: 'homelab.local',
        selectedServices: [ServiceType.CADDY]
      };

      cli.setConfig(invalidConfig);
      
      expect(() => {
        (cli as any).validateAndCompleteConfig();
      }).toThrow('Network name is required');
    });

    it('should throw error for empty services array', () => {
      const invalidConfig = {
        ip: '192.168.1.100',
        domain: 'homelab.local',
        networkName: 'homelab-network',
        selectedServices: []
      };

      cli.setConfig(invalidConfig);
      
      expect(() => {
        (cli as any).validateAndCompleteConfig();
      }).toThrow('At least one service must be selected');
    });

    it('should throw error for missing services', () => {
      const invalidConfig = {
        ip: '192.168.1.100',
        domain: 'homelab.local',
        networkName: 'homelab-network'
      };

      cli.setConfig(invalidConfig);
      
      expect(() => {
        (cli as any).validateAndCompleteConfig();
      }).toThrow('At least one service must be selected');
    });
  });
});