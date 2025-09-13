import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * n8n workflow automation service implementation
 * Provides workflow automation and integration capabilities
 */
export class N8nService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'n8n',
      ServiceType.N8N,
      false, // isCore = false (optional service)
      [], // no dependencies
      config,
      templateEngine
    );
  }

  /**
   * n8n uses environment variables for configuration, no custom config files needed
   */
  protected async generateConfigFiles(): Promise<void> {
    // n8n configuration is handled through environment variables in the Docker run command
    console.log('n8n uses environment variable configuration');
  }

  /**
   * Get n8n access URL with subdomain
   */
  getAccessUrl(): string {
    return `https://n8n.${this.config.domain}`;
  }
}