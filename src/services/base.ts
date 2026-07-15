import { Service, ServiceType, HomelabConfig } from '../core/types.js';
import { ServiceInstallationError } from '../utils/errors.js';
import { TemplateEngine } from '../templates/engine.js';
import { ContainerRuntimeUtils } from '../utils/container.js';
import { $ } from 'bun';
import { join } from 'path';

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
  private localImages: Set<string> = new Set();

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
      ADMIN_TOKEN: this.generateAdminToken(),
      CONFIG_PATH: this.config.configPath,
      DATA_PATH: this.config.dataPath,
      MAIL_USER: `admin@${this.config.domain}`,
      MAIL_PASSWORD: this.config.storagePassword || ''
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
    context['DOCKER_SOCKET_PATH'] = await ContainerRuntimeUtils.getSocketPath();
    
    for (const command of commands) {
      let interpolatedCommand = command;
      try {
        // Interpolate variables in command
        interpolatedCommand = this.interpolateCommand(command, context);
        
        // Process container commands for Docker/Podman compatibility
        if (interpolatedCommand.includes('docker ')) {
          const originalCommand = interpolatedCommand;
          interpolatedCommand = await ContainerRuntimeUtils.processCommand(interpolatedCommand);

          // Track locally built images (docker build -t <image>)
          const buildMatch = interpolatedCommand.match(/docker\s+build\s+.*-t\s+(\S+)/);
          if (buildMatch) {
            this.localImages.add(buildMatch[1]);
          }

          // Qualify short image names with docker.io/ only for Podman (Docker handles short names natively)
          const runtime = ContainerRuntimeUtils.getCurrentRuntime();
          if (runtime === 'podman') {
            interpolatedCommand = this.qualifyImageNames(interpolatedCommand);
          }

          // Check disk space before pull commands
          if (interpolatedCommand.includes('pull')) {
            await this.checkDiskSpace();
          }
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
        const isAlreadyExists = error instanceof Error && error.message.includes('already exists');

        if (isContainerCommand && isKnownError) {
          const runtime = interpolatedCommand.includes('podman') ? 'Podman' : 'Docker';
          // Detect command type by looking at the actual subcommand (e.g., "docker pull", "docker run")
          const subcommandMatch = interpolatedCommand.match(/(?:docker|podman)\s+(pull|run|build|volume|network)\b/);
          const subcommand = subcommandMatch ? subcommandMatch[1] : 'command';
          const commandType = subcommand === 'pull' ? 'image pull' :
                            subcommand === 'volume' ? 'volume creation' :
                            subcommand === 'network' ? 'network creation' :
                            subcommand === 'build' ? 'image build' :
                            subcommand === 'run' ? 'container run' : 'command';

          // Volume/network "already exists" is normal — just note it, don't alarm
          if (isAlreadyExists && (subcommand === 'volume' || subcommand === 'network')) {
            console.log(`✅ ${commandType} already exists, continuing...`);
          } else {
            console.log(`⚠️  ${commandType} failed with ${runtime}:\n→ ${interpolatedCommand}`);
            console.error(`   Error: ${error.message}`);
          }

          // Specific handling for exit codes (skip diagnosis for "already exists" — it's not a real error)
          if (!isAlreadyExists && (error.message.includes('exit code 125') || error.message.includes('exit code 126'))) {
            if (runtime === 'Podman') {
              await this.diagnosePodmanError(interpolatedCommand, error.message);
            } else {
              await this.diagnoseDockRunFailure(interpolatedCommand);
            }
          }

          this.installationFailed = !interpolatedCommand.includes('volume');
          if (this.installationFailed) {
            console.log(`⏭️  Skipping ${this.name} due to ${runtime.toLowerCase()} issues`);
          } else {
            console.log(`💡 This might be temporary or the resource might already exist`);
          }
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
      const command = `${runtime} ps --format {{.Names}}`;
      const result = await $`sh -c ${command}`.quiet();
      const output = result.stdout.toString().trim();
      if (!output) return false;
      const containers = output.split('\n');
      return containers.some(name => name === this.type || name.startsWith(this.type + '-'));
    } catch {
      return false;
    }
  }

  /**
   * Remove stale container if it exists but is not running
   */
  protected async removeStaleContainer(): Promise<void> {
    try {
      const runtime = await ContainerRuntimeUtils.detectRuntime();
      // Check for containers in any state (including Created, Exited, etc.)
      const command = `${runtime} ps -a --format {{.Names}}`;
      const result = await $`sh -c ${command}`.quiet();
      const output = result.stdout.toString().trim();
      if (!output) return;
      const containers = output.split('\n');
      const staleContainer = containers.find(name => name === this.type || name.startsWith(this.type + '-'));
      if (staleContainer) {
        console.log(`🧹 Removing stale container: ${staleContainer}`);
        await $`sh -c "${runtime} rm -f ${staleContainer}"`.quiet();
      }
    } catch {
      // Ignore errors
    }
  }

  /**
   * Qualify short image names with docker.io/ for Podman compatibility.
   * Podman requires fully qualified names; Docker Hub short names need docker.io/ prefix.
   * Skips names that already have a registry prefix (contain '.' before first '/').
   * Skips locally built images (tracked via docker build -t commands).
   */
  private qualifyImageNames(command: string): string {
    // Handle `podman pull <image>` — image is the token after 'pull'
    command = command.replace(
      /((?:docker|podman)\s+pull\s+)(\S+)/g,
      (_match: string, prefix: string, image: string) => {
        if (this.localImages.has(image)) return _match;
        const slashIdx = image.indexOf('/');
        if (slashIdx === -1 || !image.slice(0, slashIdx).includes('.')) {
          return `${prefix}docker.io/${image}`;
        }
        return _match;
      }
    );
    // Handle `podman run ... <image>` — image is the first non-flag arg
    const runMatch = command.match(/(?:^|\b)((?:docker|podman)\s+run\s+)/);
    if (runMatch) {
      const cmdStart = runMatch.index! + runMatch[0].length;
      const after = command.slice(cmdStart);
      const image = this.findRunImageName(after);
      if (image && !this.localImages.has(image)) {
        const slashIdx = image.indexOf('/');
        if (slashIdx === -1 || !image.slice(0, slashIdx).includes('.')) {
          // Replace only the image name in the original command string
          const imageIdx = command.indexOf(image, cmdStart);
          if (imageIdx !== -1) {
            command = command.slice(0, imageIdx) + `docker.io/${image}` + command.slice(imageIdx + image.length);
          }
        }
      }
    }
    return command;
  }

  /**
   * Find the image name in `podman run` arguments.
   * Parses line by line to handle multiline commands and flags with
   * space-containing values (like `-e KEY=$(cat file path)`).
   */
  private findRunImageName(args: string): string | null {
    const flagsWithValue = new Set([
      '-e', '--env', '--env-file',
      '--name', '-v', '--volume', '-p', '--publish',
      '--network', '--restart', '--label', '-l', '--mount',
      '--user', '-u', '-w', '--workdir', '--entrypoint',
      '--health-cmd', '--health-interval', '--health-retries', '--health-timeout',
      '--cpus', '--memory', '-m', '--dns', '--ip', '--ip6',
      '--log-driver', '--log-opt', '--pid', '--privileged',
      '--security-opt', '--sysctl', '--shm-size', '--tmpfs',
      '--device', '--add-host', '--dns-opt', '--dns-search',
      '-c', '--cpu-shares', '--cpuset-cpus', '--gpus',
      '--cap-add', '--cap-drop', '--ulimit',
    ]);

    const lines = args.split('\n');
    for (const line of lines) {
      const trimmed = line.trim().replace(/\\$/, '').trim();
      if (!trimmed) continue;

      const tokens = trimmed.split(/\s+/);
      let i = 0;
      while (i < tokens.length) {
        const tok = tokens[i];
        if (!tok) { i++; continue; }

        // Flags like -e / --env: value extends to end of line (may contain spaces)
        if (tok === '-e' || tok === '--env' || tok === '--env-file') {
          break; // skip rest of this line, move to next
        }

        // Other flags that take the next token as value
        if (flagsWithValue.has(tok)) {
          i += 2;
          continue;
        }

        // Standalone flags (no value)
        if (tok.startsWith('-')) {
          i++;
          continue;
        }

        // Found the image name
        return tok;
      }
    }
    return null;
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
      this.installationFailed = false;
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

      if (!this.installationFailed) {
        console.log(`${this.name} installation completed`);
      }
    } catch (error) {
      throw new ServiceInstallationError(
        this.type,
        `Installation failed: ${error}`
      );
    }
  }

  /**
   * Check if installation was successful
   */
  isInstalled(): boolean {
    return !this.installationFailed;
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
      await this.generateConfigFilesWithRetry();

      // Remove stale container if it exists but is not running
      await this.removeStaleContainer();

      // Execute run command to start the service
      if (this.serviceTemplate.commands?.run) {
        await this.executeCommands([this.serviceTemplate.commands.run]);
      }

      // Execute post-run commands (health checks, additional setup after container starts)
      // Post-run failures are non-fatal - the container is already running
      if (this.serviceTemplate.commands?.postRun) {
        try {
          await this.executeCommands(this.serviceTemplate.commands.postRun);
        } catch (error) {
          console.log(`⚠️  Post-run setup for ${this.name} failed: ${error}`);
          console.log(`💡 The container is running but some setup steps may need manual intervention`);
        }
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
      // Check if Podman machine is running (macOS specific - only on macOS)
      const platform = process.platform;
      if (platform === 'darwin') {
        try {
          const machineResult = await $`podman machine list`.quiet();
          const machineOutput = machineResult.stdout.toString();

          if (!machineOutput.includes('Running')) {
            console.log(`❌ Podman machine not running`);
            console.log(`💡 Try: podman machine start`);
            return;
          }
        } catch {
          // podman machine not available
        }
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

      // Check image availability — find the actual image name
      const runImageMatch = command.match(/(?:docker|podman)\s+run\s+/);
      let imageName: string | null = null;
      if (runImageMatch) {
        const afterRun = command.slice(runImageMatch.index! + runImageMatch[0].length);
        imageName = this.findRunImageName(afterRun);
      } else {
        // For pull commands: image is the next word after 'pull'
        const pullMatch = command.match(/(?:docker|podman)\s+pull\s+(\S+)/);
        imageName = pullMatch ? pullMatch[1] : null;
      }

      if (imageName) {
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
   * Generate config files with automatic EACCES recovery.
   * If permission denied, attempts sudo chown and retries once.
   */
  private async generateConfigFilesWithRetry(): Promise<void> {
    try {
      await this.generateConfigFiles();
    } catch (err: any) {
      const isEACCES = err?.message?.includes('EACCES') || err?.cause?.code === 'EACCES';
      if (!isEACCES) throw err;

      console.log(`⚠️  Permission denied writing config files for ${this.name}`);
      console.log('🔧 Attempting to fix directory permissions...');
      try {
        const homeDir = process.env.HOME || process.env.USERPROFILE || '~';
        const dirs = [
          join(homeDir, this.config.dataPath),
          join(homeDir, this.config.configPath),
        ];
        const user = process.env.USER || 'unknown';
        for (const dir of [...new Set(dirs)]) {
          await $`sudo chown -R ${user}:${user} ${dir}`.quiet();
        }
        console.log('✅ Permissions fixed, retrying...');
        await this.generateConfigFiles();
      } catch (sudoErr) {
        console.log('❌ Failed to fix permissions automatically');
        console.log(`💡 Try manually: sudo chown -R $USER:$USER ~/${this.config.dataPath} ~/${this.config.configPath}`);
        throw err;
      }
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
