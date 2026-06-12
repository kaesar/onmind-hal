/**
 * Main application controller for HomeLab setup
 * Orchestrates distribution detection, user input, and service installation
 */

import {
  HomelabConfig,
  DistributionStrategy,
  Service,
  ServiceType,
  DistributionType,
} from './types.js';
import { HomelabError, ServiceInstallationError } from '../utils/errors.js';
import { CLIInterface } from '../cli/interface.js';
import { ServiceFactory } from '../services/factory.js';
import { TemplateEngine } from '../templates/engine.js';
import {
  DistributionDetector,
  BaseDistributionStrategy,
} from '../distribution/strategy.js';
import { UbuntuStrategy } from '../distribution/ubuntu.js';
import { ArchStrategy } from '../distribution/arch.js';
import { AmazonLinuxStrategy } from '../distribution/amazon.js';
import { MacOSStrategy } from '../distribution/macos.js';
import { MingwStrategy } from '../distribution/mingw.js';
import { Logger } from '../utils/logger.js';
import { NetworkUtils } from '../utils/network.js';
import { ContainerRuntimeUtils } from '../utils/container.js';
import { StateManager } from '../utils/state.js';
import { $ } from 'bun';

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

      // Step 2: Validate configuration (config should already be set)
      this.validateConfiguration();

      // Step 3: Install Docker if needed
      await this.installDocker();

      // Step 4: Configure firewall
      await this.configureFirewall();

      // Step 5: Configure dnsmasq for self-signed certificates on Linux
      await this.configureDnsmasq();

      // Step 6: Install and configure services
      await this.installServices();

      // Step 7: Display completion summary
      this.displayCompletionSummary();

      // Save installation state for future re-runs
      const managementUI = this.config!.selectedServices.includes(ServiceType.DOCKHAND)
        ? ServiceType.DOCKHAND
        : ServiceType.PORTAINER;
      await StateManager.save(this.config!, managementUI);

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
      this.logger.info('🔍 Detecting operating system...');

      this.distributionStrategy =
        await this.distributionDetector.detectDistribution();
      const distributionType = this.distributionDetector.getDistributionType(
        this.distributionStrategy,
      );

      this.logger.info(`✅ Detected: ${this.distributionStrategy.name}`);

      // Update config with detected distribution if config exists
      if (this.config) {
        this.config.distribution = distributionType;

        // For macOS, store container runtime
        if (
          distributionType === DistributionType.MACOS &&
          this.distributionStrategy instanceof MacOSStrategy
        ) {
          this.config.containerRuntime =
            this.distributionStrategy.getContainerRuntime();
        }
      }
    } catch (error) {
      this.logger.error('❌ Failed to detect operating system');
      throw error;
    }
  }

  /**
   * Validate the collected configuration
   */
  private validateConfiguration(): void {
    if (!this.config) {
      throw new HomelabError(
        'Configuration is not available',
        'CONFIG_NOT_AVAILABLE',
      );
    }

    if (!this.distributionStrategy) {
      throw new HomelabError(
        'Distribution strategy is not available',
        'DISTRIBUTION_NOT_DETECTED',
      );
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
      throw new HomelabError(
        'Distribution strategy is not available',
        'DISTRIBUTION_NOT_DETECTED',
      );
    }

    try {
      this.logger.info('🐳 Installing Docker...');

      await this.distributionStrategy.installDocker();

      this.logger.info('✅ Docker installation completed');
    } catch (error) {
      this.logger.error('❌ Docker installation failed');
      throw new ServiceInstallationError(
        'Docker',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Configure firewall using the detected distribution strategy
   */
  private async configureFirewall(): Promise<void> {
    if (!this.distributionStrategy) {
      throw new HomelabError(
        'Distribution strategy is not available',
        'DISTRIBUTION_NOT_DETECTED',
      );
    }

    try {
      this.logger.info('🔥 Configuring firewall...\n');

      await this.distributionStrategy.configureFirewall();

      this.logger.info('✅ Firewall configuration completed');
    } catch (error) {
      this.logger.error('❌ Firewall configuration failed');
      throw new ServiceInstallationError(
        'Firewall',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Configure dnsmasq for local domain resolution on Linux with self-signed certificates
   */
  private async configureDnsmasq(): Promise<void> {
    if (!this.config || !this.distributionStrategy) {
      return;
    }

    // Only configure dnsmasq for Linux systems with self-signed certificates
    const isLocalDomain = NetworkUtils.isLocalDomain(
      this.config.domain,
      this.config.ip,
    );
    const isMacOS = this.config.distribution === DistributionType.MACOS;
    const usingSelfSigned = isMacOS || isLocalDomain;

    if (!usingSelfSigned || isMacOS) {
      return; // Skip for macOS or public domains
    }

    try {
      this.logger.info('🌐 Configuring dnsmasq for local DNS resolution...');

      // Configure dnsmasq with basic setup (services will be added later)
      if (this.distributionStrategy.configureDnsmasq) {
        await this.distributionStrategy.configureDnsmasq(
          this.config.domain,
          this.config.ip,
          [],
        );
        // Mark that dnsmasq was configured successfully
        (this.config as any).dnsmasqConfigured = true;
      }

      this.logger.info('✅ dnsmasq configuration completed');
    } catch (error) {
      this.logger.warn(
        '⚠️  dnsmasq configuration failed, but continuing with /etc/hosts method...',
      );
      this.logger.debug(`dnsmasq error: ${error}`);
      // Mark that dnsmasq configuration failed
      (this.config as any).dnsmasqConfigured = false;
    }
  }

  /**
   * Configure dnsmasq with installed services after installation
   */
  private async configureDnsmasqPostInstall(): Promise<void> {
    if (!this.config || !this.distributionStrategy) {
      return;
    }

    // Only configure dnsmasq for Linux systems with self-signed certificates
    const isLocalDomain = NetworkUtils.isLocalDomain(
      this.config.domain,
      this.config.ip,
    );
    const isMacOS = this.config.distribution === DistributionType.MACOS;
    const usingSelfSigned = isMacOS || isLocalDomain;

    if (!usingSelfSigned || isMacOS || this.installedServices.length === 0) {
      return; // Skip for macOS, public domains, or no services
    }

    try {
      this.logger.info('🌐 Updating dnsmasq with installed services...');

      // Configure dnsmasq with the domain and installed services
      if (this.distributionStrategy.configureDnsmasq) {
        const serviceTypes = this.installedServices.map((s) => s.type);
        await this.distributionStrategy.configureDnsmasq(
          this.config.domain,
          this.config.ip,
          serviceTypes,
        );
        // Mark that dnsmasq was configured successfully
        (this.config as any).dnsmasqConfigured = true;
      }

      this.logger.info('✅ dnsmasq updated with installed services');
    } catch (error) {
      this.logger.warn('⚠️  dnsmasq update failed, but continuing...');
      this.logger.debug(`dnsmasq error: ${error}`);
      // Mark that dnsmasq configuration failed
      (this.config as any).dnsmasqConfigured = false;
    }
  }

  /**
   * Create Docker network for HomeLab services
   */
  private async createDockerNetwork(): Promise<void> {
    if (!this.config) {
      throw new HomelabError(
        'Configuration is not available',
        'CONFIG_NOT_AVAILABLE',
      );
    }

    try {
      this.logger.info(
        `🌐 Creating container network: ${this.config.networkName}...`,
      );

      const runtime = await ContainerRuntimeUtils.detectRuntime();
      const command = `${runtime} network create ${this.config.networkName} || true`;
      await $`sh -c ${command}`;

      this.logger.info('✅ Container network ready');
    } catch (error) {
      this.logger.error('❌ Container network creation failed');
      throw new ServiceInstallationError(
        'Container Network',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Install and configure all selected services
   */
  private async installServices(): Promise<void> {
    if (!this.config) {
      throw new HomelabError(
        'Configuration is not available',
        'CONFIG_NOT_AVAILABLE',
      );
    }

    try {
      this.logger.info('📦 Installing and configuring services...');

      // Create Docker network first
      await this.createDockerNetwork();

      // Create service instances
      const services = this.serviceFactory.createServices(this.config);

      // Get installation order based on dependencies
      const orderedServices =
        this.serviceFactory.getInstallationOrder(services);

      this.logger.info(
        `📋 Installation order: ${orderedServices.map((s) => s.name).join(' → ')}`,
      );

      // Install services in order
      for (const service of orderedServices) {
        await this.installService(service);
        this.installedServices.push(service);
      }

      // Restart core services to ensure proper configuration
      await this.restartCoreServices();

      // Configure dnsmasq after services are installed (for dynamic DNS)
      await this.configureDnsmasqPostInstall();

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

      // Check if service was actually installed successfully
      if (
        'isInstalled' in service &&
        typeof service.isInstalled === 'function'
      ) {
        if (service.isInstalled()) {
          this.logger.info(
            `✅ ${service.name} installed and configured successfully`,
          );
        } else {
          this.logger.warn(`⚠️  ${service.name} installation was skipped`);
        }
      } else {
        this.logger.info(
          `✅ ${service.name} installed and configured successfully`,
        );
      }
    } catch (error) {
      this.logger.error(`❌ Failed to install ${service.name}`);
      throw new ServiceInstallationError(
        service.name,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Restart core services to ensure proper configuration
   */
  private async restartCoreServices(): Promise<void> {
    try {
      this.logger.info('🔄 Restarting core services...');

      const runtime = await ContainerRuntimeUtils.detectRuntime();
      const managementContainer = this.config!.selectedServices.includes(
        ServiceType.DOCKHAND,
      )
        ? 'dockhand'
        : 'portainer';
      const command = `${runtime} restart caddy ${managementContainer} || true`;
      await $`sh -c ${command}`;

      this.logger.info('✅ Core services restarted successfully');
    } catch (error) {
      this.logger.warn(
        '⚠️  Failed to restart core services, but continuing...',
      );
      this.logger.debug(`Restart error: ${error}`);
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
        // Note: Rollback implementation would depend on service-specific logic
        // For now, we just log the attempt
        this.logger.warn(
          `⚠️  Manual cleanup may be required for ${service.name}`,
        );
      } catch (rollbackError) {
        this.logger.error(
          `❌ Failed to rollback ${service.name}: ${rollbackError}`,
        );
      }
    }
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
    console.log(`🏷️ Domain: ${this.config.domain}`);
    console.log(`🔗 Network: ${this.config.networkName}`);

    // Show container runtime info
    const runtime = ContainerRuntimeUtils.getCurrentRuntime();
    if (runtime) {
      console.log(`🐳 Container Runtime: ${runtime}`);
    }

    if (this.config.distribution === DistributionType.MACOS) {
      console.log(
        `🐳 Container Runtime: ${this.config.containerRuntime || 'docker'}`,
      );
    }

    // Check if using self-signed certificates (same logic as Caddy service)
    const isLocalDomain = NetworkUtils.isLocalDomain(
      this.config.domain,
      this.config.ip,
    );
    const isMacOS = this.config.distribution === DistributionType.MACOS;
    const usingSelfSigned = isMacOS || isLocalDomain;

    console.log('\n📋 Installed Services:');

    for (const service of this.installedServices) {
      let accessUrl = service.getAccessUrl();

      // For self-signed certificates, show URLs with appropriate note
      if (usingSelfSigned && accessUrl.includes('https://')) {
        const dnsmasqConfigured = (this.config as any).dnsmasqConfigured;
        const needsHostsFile = isMacOS || dnsmasqConfigured === false;

        if (needsHostsFile) {
          const hostsIP = isMacOS ? '127.0.0.1' : this.config.ip;
          accessUrl += ` (requires /etc/hosts: ${hostsIP} + subdomain)`;
        } else {
          accessUrl += ` (dnsmasq configured)`;
        }
      }

      console.log(`   ✓ ${service.name}: ${accessUrl}`);
    }

    console.log('\n📚 Next Steps:');

    // Show container runtime warnings
    const containerRuntime = ContainerRuntimeUtils.getCurrentRuntime();
    if (containerRuntime) {
      const warnings =
        ContainerRuntimeUtils.getRuntimeWarnings(containerRuntime);
      if (warnings.length > 0) {
        console.log('');
        warnings.forEach((warning) => console.log(warning));
        console.log('');
      }
    }

    if (usingSelfSigned) {
      // Check if dnsmasq was configured successfully on Linux
      const dnsmasqConfigured = (this.config as any).dnsmasqConfigured;
      const needsHostsFile = isMacOS || dnsmasqConfigured === false;

      // Define web services list (used for both /etc/hosts and non-web services filtering)
      // Ordered to match README.md service table
      const webServices = [
        'copyparty',
        'portainer',
        'dockhand',
        'rustfs',
        'duckdb',
        'opensearch',
        'kafkaui',
        'rabbitmq',
        'ollama',
        'openwebui',
        'opennotebooklm',
        'n8n',
        'tooljet',
        'kestra',
        'keystonejs',
        'keycloak',
        'authelia',
        'pocketid',
        'apisix',
        'floci',
        'flociaz',
        'flocigcp',
        'k3d',
        'codeserver',
        'jupyterlab',
        'onedev',
        'semaphore',
        'liquibase',
        'sonarqube',
        'trivy',
        'karate',
        'rapidoc',
        'hoppscotch',
        'grafana',
        'loki',
        'redash',
        'uptimekuma',
        'dozzle',
        'registry',
        'nexus',
        'infisical',
        'vault',
        'vaultwarden',
        'linkwarden',
        'shlink',
        'psitransfer',
        'filestash',
        'seafile',
        'excalidraw',
        'drawio',
        'kroki',
        'outline',
        'grist',
        'nocodb',
        'directus',
        'insforge',
        'twentycrm',
        'chatwoot',
        'medusajs',
        'huly',
        'mattermost',
        'caldiy',
        'adguard',
        'jasperreports',
        'docuseal',
        'stirlingpdf',
        'pandocweb',
        'calibreweb',
        'immich',
        'libretranslate',
        'orcarouterlite',
        'litellm',
        'anythingllm',
        'copilotkit',
        'goose',
        'openclaw',
        'openhuman',
        'openjarvis',
        'firecrawl',
        'searxng',
        'plausible',
        'kurrier',
        'zrok',
        'wetty',
        'rustdesk',
      ];

      if (needsHostsFile) {
        console.log(
          '   ⚠️  IMPORTANT: Configure DNS by adding these lines to /etc/hosts:',
        );
        console.log('\n   Run: sudo nano /etc/hosts');
        console.log('\n   Then copy and paste these lines:\n');

        // Use 127.0.0.1 for macOS, server IP for Linux with self-signed certs
        const hostsIP = isMacOS ? '127.0.0.1' : this.config.ip;
        console.log(`   ${hostsIP} ${this.config.domain}`);

        // Map service types to their subdomain names (only where name differs from type)
        const subdomainMap: Record<string, string> = {
          copyparty: 'files',
          opennotebooklm: 'notebook',
          pocketid: 'auth',
          floci: 'aws',
          flociaz: 'azure',
          flocigcp: 'gcp',
          infisical: 'secrets',
          keystonejs: 'keystone',
          twentycrm: 'crm',
          medusajs: 'shop',
          caldiy: 'cal',
          docuseal: 'sign', // DocuSeal uses 'sign' subdomain
          jasperreports: 'jasper',
          stirlingpdf: 'pdf',
          pandocweb: 'pandoc',
          calibreweb: 'books',
          immich: 'photos',
          libretranslate: 'translate',
          orcarouterlite: 'orcarouter',
          plausible: 'analytics',
          seafile: 'drive',
        };

        for (const service of this.installedServices) {
          // Only add entries for web services (skip mailserver, databases without web UI)
          if (webServices.includes(service.type)) {
            const subdomain = subdomainMap[service.type] || service.type;
            console.log(`   ${hostsIP} ${subdomain}.${this.config.domain}`);
          }
        }

        console.log(
          '\n   After saving, your services will be accessible at the URLs above.',
        );
      } else {
        console.log(
          '   ✅ dnsmasq has been configured for automatic DNS resolution.',
        );
        console.log(
          '   🌐 Your services should be accessible directly at the URLs above.',
        );
        console.log(
          '   📱 Other devices on your network can also access these services.',
        );
      }

      // Show special instructions for non-web services
      const nonWebServices = this.installedServices.filter(
        (s) => !webServices.includes(s.type),
      );
      if (nonWebServices.length > 0) {
        console.log('\n   📧 Non-web services (no DNS configuration needed):');
        for (const service of nonWebServices) {
          const cfgPath = this.config!.configPath;
          const descriptions: Record<string, string> = {
            mailserver: 'Mail server - configure email client with SMTP/IMAP ports',
            cloudflared: 'Cloudflare Tunnel - managed via Cloudflare Dashboard',
            kafka: 'Streaming platform - connect via localhost:9092',
            postgresql: 'Database server - connect via localhost:5432',
            redis: 'Cache server - connect via localhost:6379',
            mongodb: 'Database server - connect via localhost:27017',
            mariadb: 'Database server - connect via localhost:3306',
            scylladb: 'Database server - connect via localhost:9042',
            fluentbit: 'Log processor - no direct connection needed',
          };

          const desc =
            descriptions[service.type] ||
            'Service - check documentation for connection details';
          console.log(`   • ${service.name}: ${desc}`);
        }
      }
    } else {
      console.log(
        '   1. Ensure your DNS is configured to point to your server IP',
      );
      console.log(
        '   2. Firewall has been configured to allow ports 22 (SSH), 80 (HTTP), and 443 (HTTPS)',
      );
      console.log('   3. Access your services using the URLs above');
      console.log('   4. Check service logs if you encounter any issues');
    }

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
    this.distributionDetector.registerStrategy(new MacOSStrategy());
    this.distributionDetector.registerStrategy(new MingwStrategy());
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
