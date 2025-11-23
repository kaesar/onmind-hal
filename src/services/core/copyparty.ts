import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

/**
 * Copyparty file sharing service implementation
 * Provides file upload/download and sharing capabilities
 */
export class CopypartyService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Copyparty',
      ServiceType.COPYPARTY,
      true, // isCore
      [], // no dependencies
      config,
      templateEngine
    );
  }

  /**
   * Generate Copyparty configuration file
   */
  protected async generateConfigFiles(): Promise<void> {
    try {
      const homeDir = process.env.HOME || process.env.USERPROFILE || '~';
      const configDir = join(homeDir, 'wsconf');
      const dataDir = join(homeDir, 'wsdata', 'copyparty');
      
      // Create config and data directories
      await mkdir(configDir, { recursive: true });
      await mkdir(dataDir, { recursive: true });

      // Load Copyparty config template
      const copypartyTemplate = await this.templateEngine.load('config/copyparty');
      const context = this.getTemplateContext();

      // Render configuration
      const configContent = this.templateEngine.render(copypartyTemplate, context);
      
      // Write configuration file
      const configPath = join(configDir, 'copyparty.conf');
      await writeFile(configPath, configContent);
      
      console.log(`Generated Copyparty configuration at ${configPath}`);
    } catch (error) {
      throw new Error(`Failed to generate Copyparty configuration: ${error}`);
    }
  }

  /**
   * Get Copyparty access URL with files subdomain
   */
  getAccessUrl(): string {
    return `https://files.${this.config.domain}`;
  }
}