/**
 * Configuration management for HomeLab application
 * Handles config file generation using templates, backup and restore functionality
 */

import { readFile, writeFile, mkdir, access, copyFile, readdir, stat } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { HomelabConfig } from './types.js';
import { ConfigurationError, FileSystemError } from '../utils/errors.js';
import { validateHomelabConfig, validateFilePath } from '../utils/validation.js';
import { TemplateEngine } from '../templates/engine.js';
import { Logger } from '../utils/logger.js';

export interface ConfigFile {
  name: string;
  path: string;
  content: string;
  templateName?: string;
}

export interface BackupInfo {
  originalPath: string;
  backupPath: string;
  timestamp: Date;
}

/**
 * Configuration manager for handling config file generation and management
 */
export class ConfigurationManager {
  private templateEngine: TemplateEngine;
  private logger: Logger;
  private configDir: string;
  private backupDir: string;
  private generatedFiles: ConfigFile[] = [];
  private backups: BackupInfo[] = [];

  constructor(
    templateEngine: TemplateEngine,
    configDir: string = './config',
    backupDir: string = './config/backups'
  ) {
    this.templateEngine = templateEngine;
    this.logger = new Logger();
    this.configDir = configDir;
    this.backupDir = backupDir;
  }

  /**
   * Generate all configuration files based on HomeLab configuration
   */
  async generateConfigurations(config: HomelabConfig): Promise<ConfigFile[]> {
    try {
      // Validate configuration before generating files
      validateHomelabConfig(config);
      
      this.logger.info('📝 Generating configuration files...');

      // Ensure config directory exists
      await this.ensureDirectoryExists(this.configDir);

      // Generate core configuration files
      const configFiles: ConfigFile[] = [];

      // Generate Caddyfile
      const caddyConfig = await this.generateCaddyfile(config);
      configFiles.push(caddyConfig);

      // Generate dnsmasq configuration if needed
      const dnsmasqConfig = await this.generateDnsmasqConfig(config);
      configFiles.push(dnsmasqConfig);

      // Generate Copyparty configuration
      const copypartyConfig = await this.generateCopypartyConfig(config);
      configFiles.push(copypartyConfig);

      // Generate service-specific configurations based on selected services
      for (const serviceType of config.selectedServices) {
        const serviceConfig = await this.generateServiceConfig(serviceType, config);
        if (serviceConfig) {
          configFiles.push(serviceConfig);
        }
      }

      // Store generated files for potential rollback
      this.generatedFiles = configFiles;

      this.logger.info(`✅ Generated ${configFiles.length} configuration files`);
      return configFiles;

    } catch (error) {
      this.logger.error('❌ Failed to generate configuration files');
      throw new ConfigurationError(
        'config',
        config,
        `Configuration generation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Generate Caddyfile configuration
   */
  private async generateCaddyfile(config: HomelabConfig): Promise<ConfigFile> {
    const template = await this.templateEngine.load('config/caddyfile');
    const content = template.render({
      domain: config.domain,
      ip: config.ip,
      networkName: config.networkName,
      services: config.selectedServices
    });

    const configFile: ConfigFile = {
      name: 'Caddyfile',
      path: join(this.configDir, 'Caddyfile'),
      content,
      templateName: 'config/caddyfile'
    };

    await this.writeConfigFile(configFile);
    return configFile;
  }

  /**
   * Generate dnsmasq configuration
   */
  private async generateDnsmasqConfig(config: HomelabConfig): Promise<ConfigFile> {
    const template = await this.templateEngine.load('config/dnsmasq');
    const content = template.render({
      domain: config.domain,
      ip: config.ip,
      networkName: config.networkName
    });

    const configFile: ConfigFile = {
      name: 'dnsmasq.conf',
      path: join(this.configDir, 'dnsmasq.conf'),
      content,
      templateName: 'config/dnsmasq'
    };

    await this.writeConfigFile(configFile);
    return configFile;
  }

  /**
   * Generate Copyparty configuration
   */
  private async generateCopypartyConfig(config: HomelabConfig): Promise<ConfigFile> {
    const template = await this.templateEngine.load('config/copyparty');
    const content = template.render({
      domain: config.domain,
      ip: config.ip,
      networkName: config.networkName
    });

    const configFile: ConfigFile = {
      name: 'copyparty.conf',
      path: join(this.configDir, 'copyparty.conf'),
      content,
      templateName: 'config/copyparty'
    };

    await this.writeConfigFile(configFile);
    return configFile;
  }

  /**
   * Generate service-specific configuration
   */
  private async generateServiceConfig(serviceType: string, config: HomelabConfig): Promise<ConfigFile | null> {
    try {
      // Only generate configs for services that need them
      const serviceConfigMap: Record<string, string> = {
        'postgresql': 'postgresql.conf',
        'n8n': 'n8n.conf',
        'redis': 'redis.conf',
        'mongodb': 'mongodb.conf',
        'mariadb': 'mariadb.conf',
        'minio': 'minio.conf',
        'ollama': 'ollama.conf',
      };

      const configFileName = serviceConfigMap[serviceType];
      if (!configFileName) {
        return null; // Service doesn't need a config file
      }

      const template = await this.templateEngine.load(`config/${serviceType}`);
      const content = template.render({
        domain: config.domain,
        ip: config.ip,
        networkName: config.networkName,
        storagePassword: config.storagePassword
      });

      const configFile: ConfigFile = {
        name: configFileName,
        path: join(this.configDir, configFileName),
        content,
        templateName: `config/${serviceType}`
      };

      await this.writeConfigFile(configFile);
      return configFile;

    } catch (error) {
      // If template doesn't exist, that's okay - not all services need config files
      this.logger.debug(`No configuration template found for service: ${serviceType}`);
      return null;
    }
  }

  /**
   * Write configuration file to disk
   */
  private async writeConfigFile(configFile: ConfigFile): Promise<void> {
    try {
      // Validate file path for security
      validateFilePath(configFile.path);
      
      // Ensure directory exists
      await this.ensureDirectoryExists(dirname(configFile.path));

      // Write the file
      await writeFile(configFile.path, configFile.content, 'utf-8');
      
      this.logger.debug(`📄 Generated config file: ${configFile.name}`);
    } catch (error) {
      throw new FileSystemError(
        'write',
        configFile.path,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Backup existing configuration files before overwriting
   */
  async backupExistingConfigurations(configFiles: ConfigFile[]): Promise<BackupInfo[]> {
    try {
      this.logger.info('💾 Backing up existing configuration files...');

      // Ensure backup directory exists
      await this.ensureDirectoryExists(this.backupDir);

      const backups: BackupInfo[] = [];
      const timestamp = new Date();

      for (const configFile of configFiles) {
        if (await this.fileExists(configFile.path)) {
          const backupInfo = await this.backupFile(configFile.path, timestamp);
          backups.push(backupInfo);
        }
      }

      this.backups = backups;
      
      if (backups.length > 0) {
        this.logger.info(`✅ Backed up ${backups.length} existing configuration files`);
      } else {
        this.logger.info('ℹ️  No existing configuration files to backup');
      }

      return backups;

    } catch (error) {
      this.logger.error('❌ Failed to backup existing configurations');
      throw new FileSystemError(
        'backup',
        this.backupDir,
        `Configuration backup failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Backup a single file
   */
  private async backupFile(filePath: string, timestamp: Date): Promise<BackupInfo> {
    const fileName = basename(filePath);
    const timestampStr = timestamp.toISOString().replace(/[:.]/g, '-');
    const backupFileName = `${fileName}.backup.${timestampStr}`;
    const backupPath = join(this.backupDir, backupFileName);

    await copyFile(filePath, backupPath);

    this.logger.debug(`💾 Backed up ${fileName} to ${backupFileName}`);

    return {
      originalPath: filePath,
      backupPath,
      timestamp
    };
  }

  /**
   * Restore configuration files from backup
   */
  async restoreFromBackup(backupInfo?: BackupInfo[]): Promise<void> {
    const backupsToRestore = backupInfo || this.backups;

    if (backupsToRestore.length === 0) {
      this.logger.warn('⚠️  No backups available to restore');
      return;
    }

    try {
      this.logger.info('🔄 Restoring configuration files from backup...');

      for (const backup of backupsToRestore) {
        if (await this.fileExists(backup.backupPath)) {
          await copyFile(backup.backupPath, backup.originalPath);
          this.logger.debug(`🔄 Restored ${basename(backup.originalPath)} from backup`);
        } else {
          this.logger.warn(`⚠️  Backup file not found: ${backup.backupPath}`);
        }
      }

      this.logger.info(`✅ Restored ${backupsToRestore.length} configuration files from backup`);

    } catch (error) {
      this.logger.error('❌ Failed to restore configurations from backup');
      throw new FileSystemError(
        'restore',
        this.backupDir,
        `Configuration restore failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Clean up generated configuration files
   */
  async cleanupGeneratedFiles(): Promise<void> {
    try {
      this.logger.info('🧹 Cleaning up generated configuration files...');

      for (const configFile of this.generatedFiles) {
        if (await this.fileExists(configFile.path)) {
          await this.deleteFile(configFile.path);
          this.logger.debug(`🗑️  Deleted generated file: ${configFile.name}`);
        }
      }

      this.generatedFiles = [];
      this.logger.info('✅ Cleanup completed');

    } catch (error) {
      this.logger.error('❌ Failed to cleanup generated files');
      throw new FileSystemError(
        'cleanup',
        this.configDir,
        `Configuration cleanup failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * List existing backup files
   */
  async listBackups(): Promise<BackupInfo[]> {
    try {
      if (!(await this.directoryExists(this.backupDir))) {
        return [];
      }

      const files = await readdir(this.backupDir);
      const backups: BackupInfo[] = [];

      for (const file of files) {
        if (file.includes('.backup.')) {
          const backupPath = join(this.backupDir, file);
          const stats = await stat(backupPath);
          
          // Extract original filename and timestamp
          const parts = file.split('.backup.');
          const originalName = parts[0];
          const timestampStr = parts[1];
          
          // Parse timestamp - convert back from safe filename format
          // Format: 2023-01-01T00-00-00-000Z -> 2023-01-01T00:00:00.000Z
          let isoTimestamp = timestampStr;
          
          // Replace hyphens with colons for time part only (after T)
          const tIndex = isoTimestamp.indexOf('T');
          if (tIndex !== -1) {
            const datePart = isoTimestamp.substring(0, tIndex + 1);
            const timePart = isoTimestamp.substring(tIndex + 1);
            // Replace hyphens with colons in time part, and last hyphen with dot for milliseconds
            const timeWithColons = timePart.replace(/-/g, ':').replace(/:(\d{3})Z$/, '.$1Z');
            isoTimestamp = datePart + timeWithColons;
          }
          
          backups.push({
            originalPath: join(this.configDir, originalName),
            backupPath,
            timestamp: new Date(isoTimestamp)
          });
        }
      }

      return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    } catch (error) {
      this.logger.error('❌ Failed to list backups');
      return [];
    }
  }

  /**
   * Validate configuration files
   */
  async validateConfigurations(configFiles: ConfigFile[]): Promise<boolean> {
    try {
      this.logger.info('🔍 Validating configuration files...');

      for (const configFile of configFiles) {
        // Check if file exists and is readable
        if (!(await this.fileExists(configFile.path))) {
          throw new FileSystemError(
            'read',
            configFile.path,
            'Configuration file not found'
          );
        }

        // Basic content validation
        if (!configFile.content || configFile.content.trim().length === 0) {
          throw new ConfigurationError(
            configFile.name,
            configFile.content,
            'Configuration file is empty'
          );
        }

        // Validate file can be read
        const fileContent = await readFile(configFile.path, 'utf-8');
        if (fileContent !== configFile.content) {
          this.logger.warn(`⚠️  File content differs from expected for: ${configFile.name}`);
        }
      }

      this.logger.info('✅ Configuration validation passed');
      return true;

    } catch (error) {
      this.logger.error('❌ Configuration validation failed');
      if (error instanceof ConfigurationError || error instanceof FileSystemError) {
        throw error;
      }
      throw new ConfigurationError(
        'validation',
        configFiles,
        `Configuration validation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get generated configuration files
   */
  getGeneratedFiles(): ConfigFile[] {
    return [...this.generatedFiles];
  }

  /**
   * Get backup information
   */
  getBackups(): BackupInfo[] {
    return [...this.backups];
  }

  /**
   * Utility method to check if file exists
   */
  private async fileExists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Utility method to check if directory exists
   */
  private async directoryExists(path: string): Promise<boolean> {
    try {
      const stats = await stat(path);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Utility method to ensure directory exists
   */
  private async ensureDirectoryExists(path: string): Promise<void> {
    try {
      await mkdir(path, { recursive: true });
    } catch (error) {
      // Ignore error if directory already exists
      if (error instanceof Error && 'code' in error && error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Utility method to delete a file
   */
  private async deleteFile(path: string): Promise<void> {
    const { unlink } = await import('fs/promises');
    await unlink(path);
  }
}