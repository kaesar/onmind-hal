/**
 * CLI interface logic for orchestrating user prompts and collecting configuration
 */

import { HomelabConfig, DistributionType, ServiceType } from '../core/types.js';
import { HomelabError } from '../utils/errors.js';
import { collectUserConfiguration, collectUserConfigurationFromArgs, promptForConfirmation, promptForPreviousInstallation } from './prompts.js';
import { StateManager } from '../utils/state.js';
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

      // Check for previous installation state
      const prevState = await StateManager.load();
      if (prevState) {
        const dateStr = new Date(prevState.installedAt).toLocaleDateString();
        console.log(`📋 Previous installation detected (${dateStr})`);
        console.log(`   IP: ${prevState.ip}  Domain: ${prevState.domain}`);
        console.log(`   Services: ${prevState.selectedServices.length} installed\n`);

        const decision = await promptForPreviousInstallation(
          dateStr,
          prevState.ip,
          prevState.domain,
          prevState.selectedServices.length,
        );

        if (decision === 'reuse') {
          const coreTypes = [ServiceType.CADDY, ServiceType.COPYPARTY, ServiceType.DOCKHAND, ServiceType.ARCANE];
          const previousOptional = prevState.selectedServices.filter(s => !coreTypes.includes(s));
          this.config = await collectUserConfiguration(previousOptional);
          await this.displayConfigurationSummary();
          const confirmed = await promptForConfirmation('Do you want to proceed with this configuration?');
          if (!confirmed) {
            console.log('❌ Configuration cancelled by user.');
            process.exit(0);
          }
          return this.validateAndCompleteConfig();
        }
        console.log('   Starting fresh configuration...\n');
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

    // --nolist takes priority over --list
    let services = this.args.nolist ? undefined : this.args.list;
    let excludeMode = !!this.args.nolist;

    if (excludeMode) {
      console.log(`   📋 Excluding ${this.args.nolist!.length} services, installing all others`);
    } else if (!services) {
      const prevState = await StateManager.load();
      if (prevState) {
        const coreTypes = [ServiceType.CADDY, ServiceType.COPYPARTY, ServiceType.DOCKHAND, ServiceType.ARCANE];
        const optionalServices = prevState.selectedServices.filter(s => !coreTypes.includes(s));
        console.log(`   📋 Restoring ${optionalServices.length} optional services from previous installation`);
        services = optionalServices;
      }
    }

    this.config = await collectUserConfigurationFromArgs(
      this.args.ip,
      this.args.domain,
      services,
      this.args.password,
      excludeMode ? this.args.nolist : undefined,
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
      const coreServiceTypes = ['caddy', 'dockhand', 'arcane', 'copyparty'];
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
      // Core services
      caddy: 'Caddy (Reverse Proxy)',
      dockhand: 'Dockhand (Docker Management UI)',
      arcane: 'Arcane (Container Management UI)',
      copyparty: 'Copyparty (File Sharing)',

      // Optional services (in README table order)
      rustfs: 'RustFS (S3-Compatible Object Storage)',
      duckdb: 'DuckDB (Analytics Database)',
      postgresql: 'PostgreSQL (Database)',
      redis: 'Redis (Cache/Queue)',
      mongodb: 'MongoDB (NoSQL Database)',
      mariadb: 'MariaDB (Database)',
      scylladb: 'ScyllaDB (NoSQL Cassandra-like)',
      opensearch: 'OpenSearch (Search & Analytics)',
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
      floci: 'Floci (AWS Emulator)',
      flociaz: 'Floci-AZ (Azure Emulator)',
      flocigcp: 'Floci-GCP (GCP Emulator)',
      k3d: 'k3d (Kubernetes in Docker)',
      codeserver: 'Code Server (VS Code IDE)',
      jupyterlab: 'JupyterLab (Notebook IDE)',
      forgejo: 'Forgejo (Git Server with CI/CD)',
      onedev: 'OneDev (Git Server)',
      jenkins: 'Jenkins (CI/CD Server)',
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
      prometheus: 'Prometheus (Monitoring & Alerting)',
      fluentbit: 'Fluent Bit (Log Collector)',
      coroot: 'Coroot (Observability)',
      redash: 'ReDash (SQL Query & Visualization)',
      uptimekuma: 'Uptime Kuma (Uptime Monitoring)',
      dozzle: 'Dozzle (Docker Log Viewer)',
      registry: 'Registry (Docker Registry)',
      nexus: 'Nexus Repository (Artifact Manager)',
      infisical: 'Infisical (Secret Management)',
      vault: 'Vault (Secrets Management)',
      consul: 'Consul (Service Discovery)',
      vaultwarden: 'Vaultwarden (Password Manager)',
      linkwarden: 'Linkwarden (Bookmark Manager)',
      shlink: 'Shlink (URL Shortener)',
      send: 'Send (E2E Encrypted File Sharing)',
      filestash: 'Filestash (Web File Manager)',
      seafile: 'Seafile (Google Drive Alternative)',
      excalidraw: 'Excalidraw (Whiteboard)',
      drawio: 'Draw.io (Diagramming)',
      wisemapping: 'WiseMapping (Mind Mapping)',
      kroki: 'Kroki (Diagram API)',
      presenton: 'Presenton (AI Presentation Generator)',
      slidev: 'Slidev (Markdown Presentation Slides)',
      outline: 'Outline (Wiki)',
      grist: 'Grist (Spreadsheet)',
      nocodb: 'NocoDB (Airtable Alternative)',
      directus: 'Directus (Headless CMS)',
      insforge: 'InsForge (AI Agent Backend Platform)',
      spark: 'Apache Spark (Data Processing Engine)',
      twentycrm: 'TwentyCRM (CRM Platform)',
      chatwoot: 'Chatwoot (Customer Engagement)',
      medusajs: 'MedusaJS (E-commerce)',
      huly: 'Huly (Project Management Platform)',
      mattermost: 'Mattermost (Team Chat)',
      calcom: 'Cal.com (Scheduling Platform)',
      adguard: 'AdGuard Home (DNS Ad Blocker)',
      jasperreports: 'JasperReports (Business Intelligence)',
      docuseal: 'DocuSeal (Document Signing)',
      stirlingpdf: 'Stirling-PDF (PDF Tools)',
      pandocweb: 'Pandoc-Web (Document Converter)',
      calibreweb: 'Calibre Web (eBook Library)',
      immich: 'Immich (Photo/Video Backup)',
      libretranslate: 'LibreTranslate (Translation API)',
      orcarouterlite: 'OrcaRouter Lite (LLM Router)',
      litellm: 'LiteLLM (LLM Proxy)',
      anythingllm: 'AnythingLLM (Multi-AI Platform)',
      voicebox: 'Voicebox (AI Voice Studio)',
      copilotkit: 'CopilotKit (AI Agent Runtime)',
      goose: 'Goose (AI Agent)',
      hermes: 'Hermes (AI Agent)',
      openclaw: 'OpenClaw (AI Agent Gateway)',
      firecrawl: 'Firecrawl (Web Scraper)',
      searxng: 'SearXNG (Metasearch Engine)',
      plausible: 'Plausible Analytics (Web Analytics)',
      ntfy: 'Ntfy (Push Notification Server)',
      mailpit: 'Mailpit (Email Testing Tool)',
      mailserver: 'Docker Mailserver (Mail Server)',
      listmonk: 'Listmonk (Email Marketing)',
      cloudflared: 'Cloudflare Tunnel (Secure Tunnel)',
      headscale: 'Headscale (VPN Server)',
      wetty: 'Wetty (Web SSH Terminal)',
      rustdesk: 'RustDesk (Remote Desktop)',
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