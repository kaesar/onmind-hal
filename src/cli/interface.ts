/**
 * CLI interface logic for orchestrating user prompts and collecting configuration
 */

import { HomelabConfig, DistributionType } from '../core/types.js';
import { HomelabError } from '../utils/errors.js';
import { collectUserConfiguration, promptForConfirmation } from './prompts.js';

export class CLIInterface {
  private config: Partial<HomelabConfig> = {};

  /**
   * Start the CLI interface (alias for run method)
   */
  async start(): Promise<HomelabConfig> {
    return this.run();
  }

  /**
   * Main method to run the CLI interface and collect user configuration
   */
  async run(): Promise<HomelabConfig> {
    try {
      console.log('🚀 Welcome to HomeLab Setup!');
      console.log('This tool will help you configure and install your HomeLab services.\n');

      // Collect user configuration
      this.config = await collectUserConfiguration();

      // Display configuration summary
      await this.displayConfigurationSummary();

      // Confirm configuration
      const confirmed = await promptForConfirmation('Do you want to proceed with this configuration?');
      
      if (!confirmed) {
        console.log('❌ Configuration cancelled by user.');
        process.exit(0);
      }

      // Validate and return complete configuration
      return this.validateAndCompleteConfig();

    } catch (error) {
      this.handleError(error);
      process.exit(1);
    }
  }

  /**
   * Display a summary of the collected configuration
   */
  private async displayConfigurationSummary(): Promise<void> {
    console.log('\n📋 Configuration Summary:');
    console.log('═'.repeat(50));
    console.log(`🌐 Server IP: ${this.config.ip}`);
    console.log(`🏷️  Domain: ${this.config.domain}`);
    console.log(`🔗 Network: ${this.config.networkName}`);
    
    if (this.config.selectedServices) {
      console.log('\n📦 Services to install:');
      const coreServices = this.config.selectedServices.filter(s => 
        ['caddy', 'portainer', 'copyparty'].includes(s)
      );
      const optionalServices = this.config.selectedServices.filter(s =>
        ['n8n', 'postgresql', 'redis', 'mongodb', 'minio', 'ollama', 'mariadb'].includes(s)
      );

      console.log('   Core services:');
      coreServices.forEach(service => {
        console.log(`   ✓ ${this.getServiceDisplayName(service)}`);
      });

      if (optionalServices.length > 0) {
        console.log('   Optional services:');
        optionalServices.forEach(service => {
          console.log(`   ✓ ${this.getServiceDisplayName(service)}`);
        });
      }

      if (this.config.databasePassword) {
        console.log('   🔐 Database password: [CONFIGURED]');
      }
    }
    console.log('═'.repeat(50));
  }

  /**
   * Get display name for a service
   */
  private getServiceDisplayName(service: string): string {
    const serviceNames: Record<string, string> = {
      caddy: 'Caddy (Reverse Proxy)',
      portainer: 'Portainer (Docker Management)',
      copyparty: 'Copyparty (File Sharing)',
      n8n: 'n8n (Workflow Automation)',
      postgresql: 'PostgreSQL (Database)',
      redis: 'Redis (Cache/Queue)',
      mongodb: 'MongoDB (NoSQL Database)',
      minio: 'Minio (Object Storage)',
      ollama: 'Ollama (LLM Server)',
      mariadb: 'MariaDB (Database)'
    };
    return serviceNames[service] || service;
  }

  /**
   * Validate the collected configuration and ensure all required fields are present
   */
  private validateAndCompleteConfig(): HomelabConfig {
    const errors: string[] = [];

    if (!this.config.ip) {
      errors.push('IP address is required');
    }

    if (!this.config.domain) {
      errors.push('Domain is required');
    }

    if (!this.config.networkName) {
      errors.push('Network name is required');
    }

    if (!this.config.selectedServices || this.config.selectedServices.length === 0) {
      errors.push('At least one service must be selected');
    }

    if (errors.length > 0) {
      throw new HomelabError(`Configuration validation failed: ${errors.join(', ')}`, 'CONFIG_VALIDATION_ERROR');
    }

    // Note: distribution will be set by the application controller after detection
    return {
      ip: this.config.ip!,
      domain: this.config.domain!,
      networkName: this.config.networkName!,
      selectedServices: this.config.selectedServices!,
      databasePassword: this.config.databasePassword,
      distribution: DistributionType.UBUNTU // Will be overridden by detection
    };
  }

  /**
   * Handle errors that occur during CLI interaction
   */
  private handleError(error: unknown): void {
    console.error('\n❌ An error occurred during configuration:');
    
    if (error instanceof HomelabError) {
      console.error(`Error: ${error.message}`);
      if (error.code) {
        console.error(`Code: ${error.code}`);
      }
    } else if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('Unknown error occurred');
    }

    console.error('\nPlease check your input and try again.');
  }

  /**
   * Get the current configuration (useful for testing)
   */
  getConfig(): Partial<HomelabConfig> {
    return { ...this.config };
  }

  /**
   * Set configuration (useful for testing)
   */
  setConfig(config: Partial<HomelabConfig>): void {
    this.config = { ...config };
  }
}