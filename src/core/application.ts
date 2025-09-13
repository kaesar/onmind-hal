/**
 * Main application controller for HomeLab setup
 * Orchestrates distribution detection, user input, and service installation
 */

import { HomelabConfig, DistributionStrategy, Service } from './types.js';
import { HomelabError, ServiceInstallationError } from '../utils/errors.js';
import { CLIInterface } from '../cli/interface.js';
import { ServiceFactory } from '../services/factory.js';
import { TemplateEngine } from '../templates/engine.js';
import { DistributionDetector, BaseDistributionStrategy } from '../distribution/strategy.js';
import { UbuntuStrategy } from '../distribution/ubuntu.js';
import { ArchStrategy } from '../distribution/arch.js';
import { AmazonLinuxStrategy } from '../distribution/amazon.js';
import { Logger } from '../utils/logger.js';

/**
 * Main application class that coordinates the entire HomeLab installation workflow
 */
export class HomelabApplication {
  private config?: HomelabConfig;
  private distributionStrategy?: DistributionStrategy;
  private serviceFactory: ServiceFactory;
  private templateEngine: TemplateEngine;
  private distributionDetector: DistributionDetector;
  private cliInterface: CLIInterface;
  private logger: Logger;
  private installedServices: Service[] = [];

  constructor() {
    this.logger = new Logger();
    this.templateEngine = new TemplateEngine();
    this.serviceFactory = new ServiceFactory(this.templateEngine);
    this.distributionDetector = new DistributionDetector();
    this.cliInterface = new CLIInterface();

    // Register distribution strategies
    this.registerDistributionStrategies();
  }

  /**
   * Main entry point for the application
   * Orchestrates the complete installation workflow
   */
  async run(): Promise<void> {
    try {
      this.logger.info('🚀 Starting HomeLab installation workflow');

      // Step 1: Detect Linux distribution
      await this.detectDistribution();

      // Step 2: Collect user configuration
      await this.collectUserConfiguration();

      // Step 3: Validate configuration
      this.validateConfiguration();

      // Step 4: Install Docker if needed
      await this.installDocker();

      // Step 5: Configure firewall
      await this.configureFirewall();

      // Step 6: Install and configure services
      await this.installServices();

      // Step 7: Display completion summary
      this.displayCompletionSummary();

      this.logger.info('✅ HomeLab installation completed successfully!');

    } catch (error) {
      await this.handleError(error);
      throw error;
    }
  }

  /**
   * Detect the current Linux distribution
   */
  private async detectDistribution(): Promise<void> {
    try {
      this.logger.info('🔍 Detecting Linux distribution...');
      
      this.distributionStrategy = await this.distributionDetector.detectDistribution();
      const distributionType = this.distributionDetector.getDistributionType(this.distributionStrategy);
      
      this.logger.info(`✅ Detected distribution: ${this.distributionStrategy.name}`);
      
      // Update config with detected distribution if config exists
      if (this.config) {
        this.config.distribution = distributionType;
      }

    } catch (error) {
      this.logger.error('❌ Failed to detect Linux distribution');
      throw error;
    }
  }

  /**
   * Collect user configuration through CLI interface
   */
  private async collectUserConfiguration(): Promise<void> {
    try {
      this.logger.info('📝 Collecting user configuration...');
      
      this.config = await this.cliInterface.run();
      
      // Set the detected distribution
      if (this.distributionStrategy) {
        const distributionType = this.distributionDetector.getDistributionType(this.distributionStrategy);
        this.config.distribution = distributionType;
      }

      this.logger.info('✅ User configuration collected successfully');

    } catch (error) {
      this.logger.error('❌ Failed to collect user configuration');
      throw error;
    }
  }

  /**
   * Validate the collected configuration
   */
  private validateConfiguration(): void {
    if (!this.config) {
      throw new HomelabError('Configuration is not available', 'CONFIG_NOT_AVAILABLE');
    }

    if (!this.distributionStrategy) {
      throw new HomelabError('Distribution strategy is not available', 'DISTRIBUTION_NOT_DETECTED');
    }

    try {
      this.logger.info('🔍 Validating configuration...');
      
      // Validate service factory configuration
      this.serviceFactory.validateConfiguration(this.config);
      
      this.logger.info('✅ Configuration validation passed');

    } catch (error) {
      this.logger.error('❌ Configuration validation failed');
      throw error;
    }
  }

  /**
   * Install Docker using the detected distribution strategy
   */
  private async installDocker(): Promise<void> {
    if (!this.distributionStrategy) {
      throw new HomelabError('Distribution strategy is not available', 'DISTRIBUTION_NOT_DETECTED');
    }

    try {
      this.logger.info('🐳 Installing Docker...');
      
      await this.distributionStrategy.installDocker();
      
      this.logger.info('✅ Docker installation completed');

    } catch (error) {
      this.logger.error('❌ Docker installation failed');
      throw new ServiceInstallationError('Docker', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Configure firewall using the detected distribution strategy
   */
  private async configureFirewall(): Promise<void> {
    if (!this.distributionStrategy) {
      throw new HomelabError('Distribution strategy is not available', 'DISTRIBUTION_NOT_DETECTED');
    }

    try {
      this.logger.info('🔥 Configuring firewall...');
      
      await this.distributionStrategy.configureFirewall();
      
      this.logger.info('✅ Firewall configuration completed');

    } catch (error) {
      this.logger.error('❌ Firewall configuration failed');
      throw new ServiceInstallationError('Firewall', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Install and configure all selected services
   */
  private async installServices(): Promise<void> {
    if (!this.config) {
      throw new HomelabError('Configuration is not available', 'CONFIG_NOT_AVAILABLE');
    }

    try {
      this.logger.info('📦 Installing and configuring services...');

      // Create service instances
      const services = this.serviceFactory.createServices(this.config);
      
      // Get installation order based on dependencies
      const orderedServices = this.serviceFactory.getInstallationOrder(services);
      
      this.logger.info(`📋 Installation order: ${orderedServices.map(s => s.name).join(' → ')}`);

      // Install services in order
      for (const service of orderedServices) {
        await this.installService(service);
        this.installedServices.push(service);
      }

      this.logger.info('✅ All services installed and configured successfully');

    } catch (error) {
      this.logger.error('❌ Service installation failed');
      
      // Attempt rollback of installed services
      await this.rollbackServices();
      
      throw error;
    }
  }

  /**
   * Install a single service with error handling
   */
  private async installService(service: Service): Promise<void> {
    try {
      this.logger.info(`🔧 Installing ${service.name}...`);
      
      // Install the service
      await service.install();
      
      // Configure the service
      await service.configure();
      
      this.logger.info(`✅ ${service.name} installed and configured successfully`);

    } catch (error) {
      this.logger.error(`❌ Failed to install ${service.name}`);
      throw new ServiceInstallationError(
        service.name, 
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Rollback installed services in case of failure
   */
  private async rollbackServices(): Promise<void> {
    if (this.installedServices.length === 0) {
      return;
    }

    this.logger.warn('🔄 Attempting to rollback installed services...');

    // Rollback services in reverse order
    for (const service of this.installedServices.reverse()) {
      try {
        this.logger.info(`🔄 Rolling back ${service.name}...`);
        
        // Note: Rollback implementation would depend on service-specific logic
        // For now, we just log the attempt
        this.logger.warn(`⚠️  Manual cleanup may be required for ${service.name}`);
        
      } catch (rollbackError) {
        this.logger.error(`❌ Failed to rollback ${service.name}: ${rollbackError}`);
      }
    }

    this.logger.warn('🔄 Rollback attempt completed. Manual cleanup may be required.');
  }

  /**
   * Display completion summary with access URLs
   */
  private displayCompletionSummary(): void {
    if (!this.config || this.installedServices.length === 0) {
      return;
    }

    console.log('\n🎉 HomeLab Installation Complete!');
    console.log('═'.repeat(60));
    console.log(`🌐 Server IP: ${this.config.ip}`);
    console.log(`🏷️  Domain: ${this.config.domain}`);
    console.log(`🔗 Network: ${this.config.networkName}`);
    console.log('\n📋 Installed Services:');

    for (const service of this.installedServices) {
      const accessUrl = service.getAccessUrl();
      console.log(`   ✓ ${service.name}: ${accessUrl}`);
    }

    console.log('\n📚 Next Steps:');
    console.log('   1. Ensure your DNS is configured to point to your server IP');
    console.log('   2. Firewall has been configured to allow ports 22 (SSH), 80 (HTTP), and 443 (HTTPS)');
    console.log('   3. Access your services using the URLs above');
    console.log('   4. Check service logs if you encounter any issues');
    console.log('═'.repeat(60));
  }

  /**
   * Handle errors that occur during the workflow
   */
  private async handleError(error: unknown): Promise<void> {
    this.logger.error('💥 An error occurred during HomeLab installation');

    if (error instanceof HomelabError) {
      this.logger.error(`Error: ${error.message}`);
      this.logger.error(`Code: ${error.code}`);
    } else if (error instanceof Error) {
      this.logger.error(`Error: ${error.message}`);
      if (error.stack) {
        this.logger.debug(`Stack trace: ${error.stack}`);
      }
    } else {
      this.logger.error(`Unknown error: ${String(error)}`);
    }

    // Attempt cleanup
    await this.rollbackServices();

    console.log('\n💡 Troubleshooting Tips:');
    console.log('   1. Check your internet connection');
    console.log('   2. Ensure you have sudo privileges');
    console.log('   3. Verify your Linux distribution is supported');
    console.log('   4. Check the logs for more detailed error information');
    console.log('   5. Try running the installation again');
  }

  /**
   * Register all available distribution strategies
   */
  private registerDistributionStrategies(): void {
    this.distributionDetector.registerStrategy(new UbuntuStrategy());
    this.distributionDetector.registerStrategy(new ArchStrategy());
    this.distributionDetector.registerStrategy(new AmazonLinuxStrategy());
  }

  /**
   * Get current configuration (useful for testing)
   */
  getConfig(): HomelabConfig | undefined {
    return this.config;
  }

  /**
   * Get current distribution strategy (useful for testing)
   */
  getDistributionStrategy(): DistributionStrategy | undefined {
    return this.distributionStrategy;
  }

  /**
   * Get installed services (useful for testing)
   */
  getInstalledServices(): Service[] {
    return [...this.installedServices];
  }

  /**
   * Set configuration (useful for testing)
   */
  setConfig(config: HomelabConfig): void {
    this.config = config;
  }

  /**
   * Set distribution strategy (useful for testing)
   */
  setDistributionStrategy(strategy: DistributionStrategy): void {
    this.distributionStrategy = strategy;
  }
}