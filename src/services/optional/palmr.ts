import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * Palmr - File sharing like WeTransfer
 */
export class PalmrService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Palmr',
      ServiceType.PALMR,
      false,
      [],
      config,
      templateEngine
    );
  }

  protected async generateConfigFiles(): Promise<void> {
    console.log('Palmr uses environment variable configuration');
  }

  getAccessUrl(): string {
    return `http://${this.config.ip}:3000`;
  }
}
