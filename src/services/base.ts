import { Service, ServiceType, HomelabConfig } from '../core/types.js';
import { ServiceInstallationError } from '../utils/errors.js';
import { TemplateEngine } from '../templates/engine.js';
import { $ } from 'bun';

/**
 * Abstract base class for all HomeLab services
 * Provides common functionality for service installation and configuration
 */
export abstract class BaseService implements Service {
  public readonly name: string;
  public readonly type: ServiceType;
  public readonly isCore: boolean;
  public readonly dependencies: string[];
  
  protected config: HomelabConfig;
  protected templateEngine: TemplateEngine;
  protected serviceTemplate: any;

  constructor(
    name: string,
    type: ServiceType,
    isCore: boolean,
    dependencies: string[],
    config: HomelabConfig,
    templateEngine: TemplateEngine
  ) {
    this.name = name;
    this.type = type;
    this.isCore = isCore;
    this.dependencies = dependencies;
    this.config = config;
    this.templateEngine = templateEngine;
  }

  /**
   * Load service template from JSON file
   */
  protected async loadServiceTemplate(): Promise<void> {
    try {
      const template = await this.templateEngine.load(`services/${this.type}`);
      this.serviceTemplate = JSON.parse(template.content);
    } catch (error) {
      throw new ServiceInstallationError(
        this.type,
        `Failed to load service template: ${error}`
      );
    }
  }

  /**
   * Get template context for variable interpolation
   */
  protected getTemplateContext(): Record<string, any> {
    return {
      NETWORK_NAME: this.config.networkName,
      DOMAIN: this.config.domain,
      IP: this.config.ip,
      DATABASE_PASSWORD: this.config.databasePassword || ''
    };
  }

  /**
   * Execute shell commands with error handling
   */
  protected async executeCommands(commands: string[]): Promise<void> {
    const context = this.getTemplateContext();
    
    for (const command of commands) {
      try {
        // Interpolate variables in command
        const interpolatedCommand = this.interpolateCommand(command, context);
        console.log(`Executing: ${interpolatedCommand}`);
        
        // Use sh -c to properly handle complex commands with pipes, redirects, etc.
        // Suppress stdout to avoid visual clutter from package managers
        const result = await $`sh -c ${interpolatedCommand}`.quiet();
        if (result.exitCode !== 0) {
          throw new Error(`Command failed with exit code ${result.exitCode}: ${result.stderr}`);
        }
      } catch (error) {
        throw new ServiceInstallationError(
          this.type,
          `Command execution failed: ${command} - ${error}`
        );
      }
    }
  }

  /**
   * Interpolate variables in command string
   */
  private interpolateCommand(command: string, context: Record<string, any>): string {
    return command.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
      const value = context[variableName];
      if (value === undefined || value === null) {
        throw new ServiceInstallationError(
          this.type,
          `Missing required variable in command: ${variableName}`
        );
      }
      return String(value);
    });
  }

  /**
   * Check if container already exists
   */
  protected async isContainerRunning(): Promise<boolean> {
    try {
      const result = await $`docker ps -a --format {{.Names}}`.quiet();
      const output = result.stdout.toString().trim();
      if (!output) return false;
      const containers = output.split('\n');
      return containers.includes(this.type);
    } catch {
      return false;
    }
  }

  /**
   * Install the service (pull Docker image and setup)
   */
  async install(): Promise<void> {
    if (!this.serviceTemplate) {
      await this.loadServiceTemplate();
    }

    // Check if container already exists
    if (await this.isContainerRunning()) {
      console.log(`⏭️  ${this.name} container already exists, skipping installation...`);
      return;
    }

    try {
      console.log(`Installing ${this.name}...`);
      
      // Execute install commands (usually docker pull)
      if (this.serviceTemplate.commands?.install) {
        await this.executeCommands(this.serviceTemplate.commands.install);
      }

      // Execute setup commands (create directories, volumes, etc.)
      if (this.serviceTemplate.commands?.setup) {
        await this.executeCommands(this.serviceTemplate.commands.setup);
      }

      console.log(`${this.name} installation completed`);
    } catch (error) {
      throw new ServiceInstallationError(
        this.type,
        `Installation failed: ${error}`
      );
    }
  }

  /**
   * Configure and start the service
   */
  async configure(): Promise<void> {
    if (!this.serviceTemplate) {
      await this.loadServiceTemplate();
    }

    // Check if container already exists and is running
    if (await this.isContainerRunning()) {
      console.log(`⏭️  ${this.name} already configured and running, skipping...`);
      return;
    }

    try {
      console.log(`Configuring ${this.name}...`);
      
      // Generate configuration files if needed
      await this.generateConfigFiles();
      
      // Execute run command to start the service
      if (this.serviceTemplate.commands?.run) {
        await this.executeCommands([this.serviceTemplate.commands.run]);
      }

      console.log(`${this.name} configuration completed`);
    } catch (error) {
      throw new ServiceInstallationError(
        this.type,
        `Configuration failed: ${error}`
      );
    }
  }

  /**
   * Get the access URL for the service
   */
  getAccessUrl(): string {
    if (!this.serviceTemplate?.accessUrl) {
      return '';
    }

    const context = this.getTemplateContext();
    return this.interpolateCommand(this.serviceTemplate.accessUrl, context);
  }

  /**
   * Generate configuration files for the service
   * Override in subclasses if custom configuration is needed
   */
  protected async generateConfigFiles(): Promise<void> {
    // Default implementation - can be overridden by subclasses
    if (this.serviceTemplate.configFiles) {
      console.log(`Generating config files for ${this.name}: ${this.serviceTemplate.configFiles.join(', ')}`);
    }
  }

  /**
   * Check if service dependencies are satisfied
   */
  async checkDependencies(): Promise<boolean> {
    // For now, just return true - dependency checking can be enhanced later
    return true;
  }
}