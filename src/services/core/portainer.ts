import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * Portainer Docker management service implementation
 * Provides web interface for Docker container management
 */
export class PortainerService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Portainer',
      ServiceType.PORTAINER,
      true, // isCore
      [], // no dependencies
      config,
      templateEngine
    );
  }

  /**
   * Portainer uses default configuration, no custom config files needed
   */
  protected async generateConfigFiles(): Promise<void> {
    // Portainer doesn't require custom configuration files
    // It uses Docker volumes for data persistence
    console.log('Portainer uses default configuration');
  }

  /**
   * Get Portainer access URL with subdomain
   */
  getAccessUrl(): string {
    return `https://portainer.${this.config.domain}`;
  }
}