import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';
import { writeFile, mkdir } from 'fs/promises';

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
      // Create config directory
      await mkdir('/opt/copyparty/config', { recursive: true });
      await mkdir('/opt/copyparty/data', { recursive: true });

      // Load Copyparty config template
      const copypartyTemplate = await this.templateEngine.load('config/copyparty');
      const context = this.getTemplateContext();

      // Render configuration
      const configContent = this.templateEngine.render(copypartyTemplate, context);
      
      // Write configuration file
      const configPath = '/opt/copyparty/config/copyparty.conf';
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