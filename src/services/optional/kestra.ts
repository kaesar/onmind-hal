import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * Kestra - Orchestration and scheduling platform
 */
export class KestraService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Kestra',
      ServiceType.KESTRA,
      false,
      [],
      config,
      templateEngine
    );
  }

  protected async generateConfigFiles(): Promise<void> {
    console.log('Kestra uses environment variable configuration');
  }

  getAccessUrl(): string {
    return `https://kestra.${this.config.domain}`;
  }
}
