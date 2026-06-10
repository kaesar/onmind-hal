import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class TooljetService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'ToolJet',
      ServiceType.TOOLJET,
      false,
      ['PostgreSQL', 'Redis'],
      config,
      templateEngine
    );
  }

  protected async generateConfigFiles(): Promise<void> {
    console.log('ToolJet uses environment variable configuration');
  }

  getAccessUrl(): string {
    return `https://tooljet.${this.config.domain}`;
  }
}
