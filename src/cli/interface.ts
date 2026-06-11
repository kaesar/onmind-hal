/**
 * CLI interface logic for orchestrating user prompts and collecting configuration
 */

import { HomelabConfig, DistributionType } from '../core/types.js';
import { HomelabError } from '../utils/errors.js';
import { collectUserConfiguration, collectUserConfigurationFromArgs, promptForConfirmation } from './prompts.js';
import { parseArgs, CliArgs, USAGE } from './args.js';

export class CLIInterface {
  private config: Partial<HomelabConfig> = {};
  private args: CliArgs;

  constructor(argv?: string[]) {
    this.args = argv ? parseArgs(argv) : {};
  }

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
      if (this.args.help) {
        console.log(USAGE);
        process.exit(0);
      }

      if (this.args.scriptMode) {
        return await this.runNonInteractive();
      }

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
   * Non-interactive mode: build config from CLI args without prompts
   */
  private async runNonInteractive(): Promise<HomelabConfig> {
    console.log('⚙️  Non-interactive mode: using provided arguments and defaults.\n');

    this.config = await collectUserConfigurationFromArgs(
      this.args.ip,
      this.args.domain,
      this.args.list,
      this.args.password,
    );

    await this.displayConfigurationSummary();
    return this.validateAndCompleteConfig();
  }

  /**
   * Display a summary of the collected configuration
   */
  private async displayConfigurationSummary(): Promise<void> {
    console.log('\n📋 Configuration Summary:');
    console.log('═'.repeat(50));
    console.log(`🌐 Server IP: ${this.config.ip}`);
    console.log(`🏷️ Domain: ${this.config.domain}`);
    console.log(`🔗 Network: ${this.config.networkName}`);
    console.log(`📁 Config path: ~/${this.config.configPath || 'ws/init'}`);
    console.log(`💾 Data path: ~/${this.config.dataPath || 'ws/data'}`);
    
    if (this.config.selectedServices) {
      console.log('\n📦 Services to install:');
      const coreServiceTypes = ['caddy', 'dockhand', 'portainer', 'copyparty'];
      const coreServices = this.config.selectedServices.filter(s => 
        coreServiceTypes.includes(s)
      );
      const optionalServices = this.config.selectedServices.filter(s =>
        !coreServiceTypes.includes(s)
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

      if (this.config.storagePassword) {
        console.log('   🔐 Storage password: [CONFIGURED]');
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
      dockhand: 'Dockhand (Docker Management UI)',
      portainer: 'Portainer (Docker Management UI)',
      copyparty: 'Copyparty (File Sharing)',
      duckdb: 'DuckDB (Analytics Database)',
      postgresql: 'PostgreSQL (Database)',
      redis: 'Redis (Cache/Queue)',
      mongodb: 'MongoDB (NoSQL Database)',
      mariadb: 'MariaDB (Database)',
      scylladb: 'ScyllaDB (NoSQL Cassandra-like)',
      opensearch: 'OpenSearch (Search & Analytics)',
      minio: 'Minio (Object Storage)',
      kafka: 'Kafka (Streaming Platform)',
      kafkaui: 'Kafka UI (Web Management)',
      rabbitmq: 'RabbitMQ (Message Broker)',
      ollama: 'Ollama (LLM Server)',
      openwebui: 'Open WebUI (Ollama Web Interface)',
      opennotebooklm: 'Open NotebookLM (AI Notes)',
      n8n: 'n8n (Workflow Automation)',
      tooljet: 'ToolJet (Low-Code Platform)',
      kestra: 'Kestra (Orchestration)',
      keystonejs: 'KeystoneJS (Headless CMS)',
      keycloak: 'Keycloak (Identity Management)',
      authelia: 'Authelia (Authentication)',
      pocketid: 'PocketID (OIDC + Passkeys)',
      apisix: 'Apache APISIX (API Gateway)',
      k3d: 'k3d (Kubernetes in Docker)',
      codeserver: 'Code Server (VS Code IDE)',
      jupyterlab: 'JupyterLab (Notebook IDE)',
      onedev: 'OneDev (Git Server)',
      semaphore: 'Semaphore UI (Ansible UI)',
      backstage: 'Backstage (Developer Portal)',
      liquibase: 'Liquibase (DB Schema Management)',
      sonarqube: 'SonarQube (Code Quality)',
      trivy: 'Trivy (Security Scanner)',
      karate: 'Karate (API/UI Test Automation)',
      rapidoc: 'RapiDoc (OpenAPI Viewer)',
      hoppscotch: 'Hoppscotch (API Client)',
      k6: 'K6 OSS (Load Testing)',
      grafana: 'Grafana (Monitoring)',
      loki: 'Loki (Log Aggregation)',
      coroot: 'Coroot (Observability)',
      fluentbit: 'Fluent Bit (Log Collector)',
      uptimekuma: 'Uptime Kuma (Uptime Monitoring)',
      registry: 'Registry (Docker Registry)',
      nexus: 'Nexus Repository (Artifact Manager)',
      vault: 'Vault (Secrets Management)',
      consul: 'Consul (Service Discovery)',
      vaultwarden: 'Vaultwarden (Password Manager)',
      linkwarden: 'Linkwarden (Bookmark Manager)',
      shlink: 'Shlink (URL Shortener)',
      psitransfer: 'PsiTransfer (File Sharing)',
      filestash: 'Filestash (Web File Manager)',
      excalidraw: 'Excalidraw (Whiteboard)',
      drawio: 'Draw.io (Diagramming)',
      wisemapping: 'WiseMapping (Mind Mapping)',
      kroki: 'Kroki (Diagram API)',
      outline: 'Outline (Wiki)',
      grist: 'Grist (Spreadsheet)',
      nocodb: 'NocoDB (Airtable Alternative)',
      twentycrm: 'TwentyCRM (CRM Platform)',
      medusajs: 'MedusaJS (E-commerce)',
      mattermost: 'Mattermost (Team Chat)',
      caldiy: 'Cal.diy (Scheduling Platform)',
      adguard: 'AdGuard Home (DNS Ad Blocker)',
      jasperreports: 'JasperReports (Business Intelligence)',
      stirlingpdf: 'Stirling-PDF (PDF Tools)',
      pandocweb: 'Pandoc-Web (Document Converter)',
      libretranslate: 'LibreTranslate (Translation API)',
      directus: 'Directus (Headless CMS)',
      orcarouterlite: 'OrcaRouter Lite (LLM Router)',
      mailserver: 'Docker Mailserver (Mail Server)',
      kurrier: 'Kurrier (Email Marketing)',
      zrok: 'Zrok (Zero-Trust Tunneling)',
      cloudflared: 'Cloudflare Tunnel (Secure Tunnel)',
      wetty: 'Wetty (Web SSH Terminal)',
      dozzle: 'Dozzle (Docker Log Viewer)',
      huly: 'Huly (Project Management Platform)',
      rustfs: 'RustFS (S3-Compatible Object Storage)',
      infisical: 'Infisical (Secret Management)',
      floci: 'Floci (AWS Emulator)',
      flociaz: 'Floci-AZ (Azure Emulator)',
      flocigcp: 'Floci-GCP (GCP Emulator)',
      litellm: 'LiteLLM (LLM Proxy)',
      goose: 'Goose (AI Agent)',
      hermes: 'Hermes (AI Agent)',
      openclaw: 'OpenClaw (AI Agent Gateway)',
      openjarvis: 'OpenJarvis (AI Assistant Platform)',
      firecrawl: 'Firecrawl (Web Scraper)',
      searxng: 'SearXNG (Metasearch Engine)',
      plausible: 'Plausible Analytics (Web Analytics)',
      redash: 'ReDash (SQL Query & Visualization)',
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
      configPath: this.config.configPath || 'ws/init',
      dataPath: this.config.dataPath || 'ws/data',
      selectedServices: this.config.selectedServices!,
      storagePassword: this.config.storagePassword,
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