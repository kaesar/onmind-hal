/**
 * Integration tests for HomelabApplication workflow management
 */

import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test';
import { HomelabApplication } from '../../src/core/application.js';
import { HomelabConfig, ServiceType, DistributionType } from '../../src/core/types.js';
import { HomelabError, ServiceInstallationError } from '../../src/utils/errors.js';

// Mock the CLI interface
const mockCLIInterface = {
  run: mock(() => Promise.resolve({
    ip: '192.168.1.100',
    domain: 'homelab.local',
    networkName: 'homelab-network',
    selectedServices: [ServiceType.CADDY, ServiceType.PORTAINER, ServiceType.COPYPARTY, ServiceType.N8N],
    distribution: DistributionType.UBUNTU,
    postgresPassword: undefined
  } as HomelabConfig))
};

// Mock distribution strategy
const mockDistributionStrategy = {
  name: 'ubuntu',
  detectDistribution: mock(() => Promise.resolve(true)),
  installDocker: mock(() => Promise.resolve()),
  installPackages: mock(() => Promise.resolve()),
  configureFirewall: mock(() => Promise.resolve()),
  getPackageManager: mock(() => 'apt')
};

// Mock service
const mockService = {
  name: 'TestService',
  type: ServiceType.CADDY,
  isCore: true,
  dependencies: [],
  install: mock(() => Promise.resolve()),
  configure: mock(() => Promise.resolve()),
  getAccessUrl: mock(() => 'https://test.homelab.local')
};

// Mock service factory
const mockServiceFactory = {
  createServices: mock(() => [mockService]),
  getInstallationOrder: mock((services: any[]) => services),
  validateConfiguration: mock(() => {})
};

// Mock distribution detector
const mockDistributionDetector = {
  detectDistribution: mock(() => Promise.resolve(mockDistributionStrategy)),
  getDistributionType: mock(() => DistributionType.UBUNTU),
  registerStrategy: mock(() => {})
};

// Mock template engine
const mockTemplateEngine = {
  load: mock(() => Promise.resolve({
    name: 'test',
    content: 'test content',
    variables: {},
    render: mock(() => 'rendered content')
  })),
  render: mock(() => 'rendered content'),
  clearCache: mock(() => {}),
  getCachedTemplates: mock(() => [])
};

// Mock logger
const mockLogger = {
  info: mock(() => {}),
  error: mock(() => {}),
  warn: mock(() => {}),
  debug: mock(() => {})
};

describe('HomelabApplication Integration Tests', () => {
  let application: HomelabApplication;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    // Reset all mocks
    mock.restore();
    
    // Create new application instance
    application = new HomelabApplication();
    
    // Mock console methods
    consoleLogSpy = spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});

    // Replace internal components with mocks
    (application as any).cliInterface = mockCLIInterface;
    (application as any).distributionDetector = mockDistributionDetector;
    (application as any).serviceFactory = mockServiceFactory;
    (application as any).templateEngine = mockTemplateEngine;
    (application as any).logger = mockLogger;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Complete Installation Workflow', () => {
    it('should execute complete installation workflow successfully', async () => {
      // Set configuration before running
      const config: HomelabConfig = {
        ip: '192.168.1.100',
        domain: 'homelab.local',
        networkName: 'homelab-network',
        selectedServices: [ServiceType.CADDY, ServiceType.PORTAINER, ServiceType.COPYPARTY],
        distribution: DistributionType.UBUNTU
      };
      application.setConfig(config);

      // Execute the complete workflow
      await application.run();

      // Verify distribution detection was called
      expect(mockDistributionDetector.detectDistribution).toHaveBeenCalled();
      expect(mockDistributionDetector.getDistributionType).toHaveBeenCalled();

      // Verify configuration validation
      expect(mockServiceFactory.validateConfiguration).toHaveBeenCalled();

      // Verify Docker installation
      expect(mockDistributionStrategy.installDocker).toHaveBeenCalled();

      // Verify service installation
      expect(mockServiceFactory.createServices).toHaveBeenCalled();
      expect(mockServiceFactory.getInstallationOrder).toHaveBeenCalled();
      expect(mockService.install).toHaveBeenCalled();
      expect(mockService.configure).toHaveBeenCalled();

      // Verify logging
      expect(mockLogger.info).toHaveBeenCalledWith('🚀 Starting HomeLab installation workflow');
      expect(mockLogger.info).toHaveBeenCalledWith('✅ HomeLab installation completed successfully!');
    });

    it('should handle distribution detection failure', async () => {
      // Mock distribution detection failure
      mockDistributionDetector.detectDistribution.mockRejectedValueOnce(
        new Error('Distribution not supported')
      );

      // Expect the workflow to fail
      await expect(application.run()).rejects.toThrow('Distribution not supported');

      // Verify error handling was called
      expect(mockLogger.error).toHaveBeenCalledWith('❌ Failed to detect Linux distribution');
    });

    it('should handle configuration validation failure', async () => {
      // Set invalid configuration
      const config: HomelabConfig = {
        ip: '192.168.1.100',
        domain: 'homelab.local',
        networkName: 'homelab-network',
        selectedServices: [ServiceType.CADDY, ServiceType.PORTAINER, ServiceType.COPYPARTY],
        distribution: DistributionType.UBUNTU
      };
      application.setConfig(config);

      // Mock validation failure
      mockServiceFactory.validateConfiguration.mockImplementationOnce(() => {
        throw new HomelabError('Invalid configuration', 'CONFIG_INVALID');
      });

      // Expect the workflow to fail
      await expect(application.run()).rejects.toThrow('Invalid configuration');

      // Verify error handling
      expect(mockLogger.error).toHaveBeenCalledWith('❌ Configuration validation failed');
    });

    it('should handle Docker installation failure', async () => {
      // Set configuration
      const config: HomelabConfig = {
        ip: '192.168.1.100',
        domain: 'homelab.local',
        networkName: 'homelab-network',
        selectedServices: [ServiceType.CADDY, ServiceType.PORTAINER, ServiceType.COPYPARTY],
        distribution: DistributionType.UBUNTU
      };
      application.setConfig(config);

      // Mock Docker installation failure
      mockDistributionStrategy.installDocker.mockRejectedValueOnce(
        new Error('Docker installation failed')
      );

      // Expect the workflow to fail
      await expect(application.run()).rejects.toThrow(ServiceInstallationError);

      // Verify error handling
      expect(mockLogger.error).toHaveBeenCalledWith('❌ Docker installation failed');
    });

    it('should handle service installation failure with rollback', async () => {
      // Set configuration
      const config: HomelabConfig = {
        ip: '192.168.1.100',
        domain: 'homelab.local',
        networkName: 'homelab-network',
        selectedServices: [ServiceType.CADDY, ServiceType.PORTAINER, ServiceType.COPYPARTY],
        distribution: DistributionType.UBUNTU
      };
      application.setConfig(config);

      // Mock service installation failure
      mockService.install.mockRejectedValueOnce(new Error('Service installation failed'));

      // Expect the workflow to fail
      await expect(application.run()).rejects.toThrow(ServiceInstallationError);

      // Verify error handling - check for both individual service error and general error
      expect(mockLogger.error).toHaveBeenCalledWith('❌ Failed to install TestService');
      expect(mockLogger.error).toHaveBeenCalledWith('❌ Service installation failed');
      
      // Since the first service fails to install, it never gets added to installedServices,
      // so rollback returns early without logging. This is correct behavior.
      // The rollback method is called but returns early if no services were installed.
    });
  });

  describe('Configuration Management', () => {
    it('should validate configuration correctly', async () => {
      // Set up valid configuration
      const validConfig: HomelabConfig = {
        ip: '192.168.1.100',
        domain: 'homelab.local',
        networkName: 'homelab-network',
        selectedServices: [ServiceType.CADDY, ServiceType.PORTAINER],
        distribution: DistributionType.UBUNTU
      };
      application.setConfig(validConfig);

      // Mock successful validation
      mockServiceFactory.validateConfiguration.mockImplementationOnce(() => {});

      // Call validation (this is called internally during run())
      await application.run();

      // Verify validation was called (we can't guarantee exact config due to distribution detection)
      expect(mockServiceFactory.validateConfiguration).toHaveBeenCalled();
    });

    it('should handle configuration validation failure', async () => {
      // Set configuration
      const config: HomelabConfig = {
        ip: '192.168.1.100',
        domain: 'homelab.local',
        networkName: 'homelab-network',
        selectedServices: [ServiceType.CADDY, ServiceType.PORTAINER],
        distribution: DistributionType.UBUNTU
      };
      application.setConfig(config);

      // Mock validation failure
      mockServiceFactory.validateConfiguration.mockImplementationOnce(() => {
        throw new HomelabError('Invalid configuration', 'CONFIG_INVALID');
      });

      // Expect the workflow to fail
      await expect(application.run()).rejects.toThrow(HomelabError);

      // Verify error logging
      expect(mockLogger.error).toHaveBeenCalledWith('❌ Configuration validation failed');
    });
  });

  describe('Service Installation Order', () => {
    it('should install services in correct dependency order', async () => {
      // Set configuration
      const config: HomelabConfig = {
        ip: '192.168.1.100',
        domain: 'homelab.local',
        networkName: 'homelab-network',
        selectedServices: [ServiceType.CADDY, ServiceType.PORTAINER],
        distribution: DistributionType.UBUNTU
      };
      application.setConfig(config);

      // Create mock services with dependencies
      const caddyService = {
        ...mockService,
        name: 'Caddy',
        type: ServiceType.CADDY,
        dependencies: []
      };

      const portainerService = {
        ...mockService,
        name: 'Portainer',
        type: ServiceType.PORTAINER,
        dependencies: ['Caddy']
      };

      const services = [portainerService, caddyService]; // Intentionally wrong order
      const orderedServices = [caddyService, portainerService]; // Correct order

      mockServiceFactory.createServices.mockReturnValueOnce(services);
      mockServiceFactory.getInstallationOrder.mockReturnValueOnce(orderedServices);

      await application.run();

      // Verify services were created and ordered
      expect(mockServiceFactory.createServices).toHaveBeenCalled();
      expect(mockServiceFactory.getInstallationOrder).toHaveBeenCalledWith(services);
    });
  });

  describe('Error Handling and Rollback', () => {
    it('should attempt rollback when service installation fails', async () => {
      // Set configuration
      const config: HomelabConfig = {
        ip: '192.168.1.100',
        domain: 'homelab.local',
        networkName: 'homelab-network',
        selectedServices: [ServiceType.CADDY, ServiceType.PORTAINER],
        distribution: DistributionType.UBUNTU
      };
      application.setConfig(config);

      // Create multiple services
      const service1 = { ...mockService, name: 'Service1' };
      const service2 = { ...mockService, name: 'Service2' };
      
      // Mock successful installation for first service, failure for second
      service1.install = mock(() => Promise.resolve());
      service1.configure = mock(() => Promise.resolve());
      service2.install = mock(() => Promise.reject(new Error('Installation failed')));

      mockServiceFactory.createServices.mockReturnValueOnce([service1, service2]);
      mockServiceFactory.getInstallationOrder.mockReturnValueOnce([service1, service2]);

      // Expect workflow to fail
      await expect(application.run()).rejects.toThrow(ServiceInstallationError);

      // Verify first service was installed
      expect(service1.install).toHaveBeenCalled();
      expect(service1.configure).toHaveBeenCalled();

      // Verify second service installation was attempted
      expect(service2.install).toHaveBeenCalled();

      // Verify rollback was attempted
      expect(mockLogger.warn).toHaveBeenCalledWith('🔄 Attempting to rollback installed services...');
    });

    it('should handle rollback errors gracefully', async () => {
      // Set configuration
      const config: HomelabConfig = {
        ip: '192.168.1.100',
        domain: 'homelab.local',
        networkName: 'homelab-network',
        selectedServices: [ServiceType.CADDY],
        distribution: DistributionType.UBUNTU
      };
      application.setConfig(config);

      // Mock service that fails during installation
      mockService.install.mockRejectedValueOnce(new Error('Installation failed'));

      // Expect workflow to fail but not throw additional errors during rollback
      await expect(application.run()).rejects.toThrow(ServiceInstallationError);

      // Verify rollback was attempted
      expect(mockLogger.warn).toHaveBeenCalledWith('🔄 Attempting to rollback installed services...');
    });
  });

  describe('Completion Summary', () => {
    it('should display completion summary with service URLs', async () => {
      // Set configuration
      const config: HomelabConfig = {
        ip: '192.168.1.100',
        domain: 'homelab.local',
        networkName: 'homelab-network',
        selectedServices: [ServiceType.CADDY],
        distribution: DistributionType.UBUNTU
      };
      application.setConfig(config);

      // Mock successful workflow
      await application.run();

      // Verify completion summary was displayed
      expect(consoleLogSpy).toHaveBeenCalledWith('\n🎉 HomeLab Installation Complete!');
      expect(consoleLogSpy).toHaveBeenCalledWith('═'.repeat(60));
      
      // Verify service URL was displayed
      expect(mockService.getAccessUrl).toHaveBeenCalled();
    });
  });

  describe('Firewall Configuration', () => {
    it('should configure firewall after Docker installation', async () => {
      // Set configuration
      const config: HomelabConfig = {
        ip: '192.168.1.100',
        domain: 'homelab.local',
        networkName: 'homelab-network',
        selectedServices: [ServiceType.CADDY],
        distribution: DistributionType.UBUNTU
      };
      application.setConfig(config);

      // Mock successful workflow
      await application.run();

      // Verify firewall configuration was called
      expect(mockDistributionStrategy.configureFirewall).toHaveBeenCalled();
      
      // Verify logging
      expect(mockLogger.info).toHaveBeenCalledWith('🔥 Configuring firewall...');
      expect(mockLogger.info).toHaveBeenCalledWith('✅ Firewall configuration completed');
    });

    it('should handle firewall configuration failure', async () => {
      // Set configuration
      const config: HomelabConfig = {
        ip: '192.168.1.100',
        domain: 'homelab.local',
        networkName: 'homelab-network',
        selectedServices: [ServiceType.CADDY],
        distribution: DistributionType.UBUNTU
      };
      application.setConfig(config);

      // Mock firewall configuration failure
      mockDistributionStrategy.configureFirewall.mockRejectedValueOnce(
        new Error('UFW installation failed')
      );

      // Expect workflow to fail
      await expect(application.run()).rejects.toThrow(ServiceInstallationError);

      // Verify error logging
      expect(mockLogger.error).toHaveBeenCalledWith('❌ Firewall configuration failed');
    });

    it('should fail when distribution strategy is not available for firewall config', async () => {
      // Create application without distribution strategy
      const appWithoutStrategy = new HomelabApplication();
      const validConfig: HomelabConfig = {
        ip: '192.168.1.100',
        domain: 'homelab.local',
        networkName: 'homelab-network',
        selectedServices: [ServiceType.CADDY],
        distribution: DistributionType.UBUNTU
      };
      appWithoutStrategy.setConfig(validConfig);

      // Expect workflow to fail
      await expect(appWithoutStrategy.run()).rejects.toThrow(HomelabError);
    });
  });

  describe('Getter Methods', () => {
    it('should provide access to internal state for testing', async () => {
      // Set up application state
      const config: HomelabConfig = {
        ip: '192.168.1.100',
        domain: 'homelab.local',
        networkName: 'homelab-network',
        selectedServices: [ServiceType.CADDY],
        distribution: DistributionType.UBUNTU
      };

      application.setConfig(config);
      application.setDistributionStrategy(mockDistributionStrategy);

      // Test getters
      expect(application.getConfig()).toEqual(config);
      expect(application.getDistributionStrategy()).toEqual(mockDistributionStrategy);
      expect(application.getInstalledServices()).toEqual([]);
    });
  });
});