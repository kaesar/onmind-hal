import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * Authelia - Authentication and authorization server
 */
export class AutheliaService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Authelia',
      ServiceType.AUTHELIA,
      false,
      [ServiceType.REDIS],
      config,
      templateEngine
    );
  }

  protected async generateConfigFiles(): Promise<void> {
    console.log('Authelia uses environment variable configuration');
  }

  getAccessUrl(): string {
    return `http://${this.config.ip}:9091`;
  }
}
