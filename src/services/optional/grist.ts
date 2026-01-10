import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * Grist - Modern spreadsheet with relational database
 */
export class GristService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Grist',
      ServiceType.GRIST,
      false,
      [],
      config,
      templateEngine
    );
  }

  protected async generateConfigFiles(): Promise<void> {
    console.log('Grist uses environment variable configuration');
  }

  getAccessUrl(): string {
    return `https://grist.${this.config.domain}`;
  }
}
