import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * Outline - Team knowledge base and wiki
 */
export class OutlineService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Outline',
      ServiceType.OUTLINE,
      false,
      [ServiceType.POSTGRESQL, ServiceType.REDIS],
      config,
      templateEngine
    );
  }

  protected async generateConfigFiles(): Promise<void> {
    console.log('Outline uses environment variable configuration');
  }

  getAccessUrl(): string {
    return `http://${this.config.ip}:3030`;
  }
}
