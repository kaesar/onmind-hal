import { Service, ServiceType, HomelabConfig } from '../core/types.js';
import { ServiceInstallationError } from '../utils/errors.js';
import { TemplateEngine } from '../templates/engine.js';
import { ContainerRuntimeUtils } from '../utils/container.js';
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
  private installationFailed: boolean = false;

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
   * Load service template from YAML or JSON file
   */
  protected async loadServiceTemplate(): Promise<void> {
    try {
      const template = await this.templateEngine.load(`services/${this.type}`);
      // Template content is already parsed by the engine
      this.serviceTemplate = template.content;
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
      STORAGE_PASSWORD: this.config.storagePassword || '',
      ADMIN_TOKEN: this.generateAdminToken()
    };
  }

  /**
   * Generate a secure admin token for services that need it
   */
  private generateAdminToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Execute shell commands with error handling
   */
  protected async executeCommands(commands: string[]): Promise<void> {
    const context = this.getTemplateContext();
    
    for (const command of commands) {
      let interpolatedCommand = command;
      try {
        // Interpolate variables in command
        interpolatedCommand = this.interpolateCommand(command, context);
        
        // Process container commands for Docker/Podman compatibility
        if (interpolatedCommand.includes('docker ')) {
          const originalCommand = interpolatedCommand;
          interpolatedCommand = await ContainerRuntimeUtils.processCommand(interpolatedCommand);
          
          // Check disk space before pull commands
          if (interpolatedCommand.includes('pull')) {
            await this.checkDiskSpace();
          }
          
          // console.log(`Command processing: ${originalCommand}\n→ ${interpolatedCommand}`);
        }
        
        console.log(`Executing: ${interpolatedCommand}`);
        
        // Use sh -c to properly handle complex commands with pipes, redirects, etc.
        const result = await $`sh -c ${interpolatedCommand}`.quiet();
        if (result.exitCode !== 0) {
          const errorMsg = result.stderr.toString().trim();
          console.log(`❌ Error: ${errorMsg}`);
          throw new Error(`Command failed with exit code ${result.exitCode}: ${errorMsg}`);
        }
      } catch (error) {
        // Check for container runtime issues (both Docker and Podman)
        const isContainerCommand = interpolatedCommand.includes('pull') || 
                                  interpolatedCommand.includes('volume create') ||
                                  interpolatedCommand.includes('network create') ||
                                  interpolatedCommand.includes('build') ||
                                  interpolatedCommand.includes('run');
        const isKnownError = error instanceof Error && 
          (error.message.includes('unauthorized') || 
           error.message.includes('exit code 125') ||
           error.message.includes('exit code 1') ||
           error.message.includes('already exists'));
        
        if (isContainerCommand && isKnownError) {
          const runtime = interpolatedCommand.includes('podman') ? 'Podman' : 'Docker';
          const commandType = interpolatedCommand.includes('pull') ? 'image pull' :
                            interpolatedCommand.includes('volume') ? 'volume creation' :
                            interpolatedCommand.includes('network') ? 'network creation' :
                            interpolatedCommand.includes('build') ? 'image build' :
                            interpolatedCommand.includes('run') ? 'container run' : 'command';
          
          console.log(`⚠️  ${commandType} failed with ${runtime}`);
          
          // Specific handling for exit code 125
          if (error.message.includes('exit code 125')) {
            if (runtime === 'Podman') {
              await this.diagnosePodmanError(interpolatedCommand, error.message);
            } else {
              await this.diagnoseDockRunFailure(interpolatedCommand);
            }
          }
          
          console.log(`⏭️  Skipping ${this.name} due to ${runtime.toLowerCase()} issues`);
          console.log(`💡 This might be temporary or the resource might already exist`);
          this.installationFailed = true;
          return;
        }
        
        throw new ServiceInstallationError(
          this.type,
          `Command execution failed: ${interpolatedCommand} - ${error}`
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
      const runtime = await ContainerRuntimeUtils.detectRuntime();
      const command = `${runtime} ps -a --format {{.Names}}`;
      const result = await $`sh -c ${command}`.quiet();
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
        if (this.installationFailed) {
          console.log(`${this.name} installation skipped`);
          return;
        }
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
    if (this.installationFailed) {
      console.log(`⏭️  Skipping ${this.name} configuration due to installation failure`);
      return;
    }

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
   * Diagnose Podman-specific errors
   */
  private async diagnosePodmanError(command: string, errorMessage: string): Promise<void> {
    console.log(`🔍 Diagnosing Podman error for ${this.name}:`);
    
    try {
      // Check if Podman machine is running (macOS specific)
      const machineResult = await $`podman machine list`.quiet();
      const machineOutput = machineResult.stdout.toString();
      
      if (!machineOutput.includes('Running')) {
        console.log(`❌ Podman machine not running`);
        console.log(`💡 Try: podman machine start`);
        return;
      }
      
      // Check network existence
      if (command.includes('--network')) {
        const networkMatch = command.match(/--network\s+(\S+)/);
        if (networkMatch) {
          const networkName = networkMatch[1];
          try {
            await $`podman network inspect ${networkName}`.quiet();
            console.log(`✅ Network '${networkName}' exists`);
          } catch {
            console.log(`❌ Network '${networkName}' not found`);
            console.log(`💡 Try: podman network create ${networkName}`);
            return;
          }
        }
      }
      
      // Check port conflicts
      const portMatch = command.match(/-p\s+(\d+):(\d+)/);
      if (portMatch) {
        const hostPort = portMatch[1];
        try {
          const portCheck = await $`lsof -i :${hostPort}`.quiet();
          if (portCheck.stdout.toString().trim()) {
            console.log(`❌ Port ${hostPort} is already in use`);
            console.log(`💡 Try a different port or stop the conflicting service`);
            return;
          }
        } catch {
          // Port is free
        }
      }
      
      // Check image availability
      const imageMatch = command.match(/([^\s]+)$/);
      if (imageMatch) {
        const imageName = imageMatch[1];
        try {
          await $`podman image inspect ${imageName}`.quiet();
          console.log(`✅ Image '${imageName}' is available`);
        } catch {
          console.log(`❌ Image '${imageName}' not found locally`);
          console.log(`💡 Try: podman pull ${imageName}`);
          return;
        }
      }
      
      console.log(`❓ Unknown Podman error - check logs with: podman logs ${this.type}`);
      
    } catch (diagError) {
      console.log(`⚠️  Could not diagnose Podman error: ${diagError}`);
    }
  }

  /**
   * Diagnose Docker run failure by checking common issues
   */
  private async diagnoseDockRunFailure(command: string): Promise<void> {
    console.log(`🔍 Diagnosing Docker run failure for ${this.name}...`);
    
    try {
      // Extract image name from command
      const imageMatch = command.match(/([^\s]+)\s*$/)?.[1];
      if (imageMatch) {
        // Check if image exists
        const runtime = command.includes('podman') ? 'podman' : 'docker';
        const checkImageResult = await $`sh -c "${runtime} images -q ${imageMatch}"`.quiet();
        
        if (!checkImageResult.stdout.toString().trim()) {
          console.log(`⚠️  Image ${imageMatch} not found locally`);
          console.log(`💡 Try running: ${runtime} pull ${imageMatch}`);
        }
        
        // Check if container name already exists
        const nameMatch = command.match(/--name\s+([^\s]+)/);
        if (nameMatch) {
          const containerName = nameMatch[1];
          const checkContainerResult = await $`sh -c "${runtime} ps -a --format {{.Names}}"`.quiet();
          const containers = checkContainerResult.stdout.toString().split('\n');
          
          if (containers.includes(containerName)) {
            console.log(`⚠️  Container '${containerName}' already exists`);
            console.log(`💡 Try running: ${runtime} rm ${containerName}`);
          }
        }
        
        // Check for port conflicts
        const portMatches = command.match(/-p\s+(\d+):/g);
        if (portMatches) {
          console.log(`💡 Check if ports are available: ${portMatches.join(', ')}`);
        }
      }
    } catch (diagError) {
      console.log(`⚠️  Could not diagnose issue: ${diagError}`);
    }
  }

  /**
   * Check available disk space
   */
  private async checkDiskSpace(): Promise<void> {
    try {
      const result = await $`df -h /var/lib`.quiet();
      const output = result.stdout.toString();
      const lines = output.trim().split('\n');
      
      if (lines.length > 1) {
        const dataLine = lines[1];
        const columns = dataLine.split(/\s+/);
        const availableSpace = columns[3]; // Available space column
        
        // Parse available space (e.g., "1.2G", "500M")
        const spaceMatch = availableSpace.match(/(\d+(?:\.\d+)?)([KMGT]?)/);
        if (spaceMatch) {
          const [, amount, unit] = spaceMatch;
          const numAmount = parseFloat(amount);
          
          // Convert to GB for comparison
          let spaceInGB = numAmount;
          switch (unit) {
            case 'K': spaceInGB = numAmount / 1024 / 1024; break;
            case 'M': spaceInGB = numAmount / 1024; break;
            case 'T': spaceInGB = numAmount * 1024; break;
            // G or no unit assumed to be GB
          }
          
          if (spaceInGB < 2) {
            console.log(`⚠️  Low disk space: ${availableSpace} available`);
            console.log(`💡 Consider running: docker system prune -a`);
            
            if (spaceInGB < 0.5) {
              console.log(`⚠️  Very low disk space - image pull may fail`);
            }
          }
        }
      }
    } catch (error) {
      // Silently continue if disk space check fails
    }
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