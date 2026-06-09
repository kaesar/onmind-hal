import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class FilestashService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Filestash',
      ServiceType.FILESTASH,
      false,
      [],
      config,
      templateEngine
    );
  }

  protected async generateConfigFiles(): Promise<void> {
    console.log('Filestash uses environment variable configuration');
  }

  getAccessUrl(): string {
    return `https://filestash.${this.config.domain}`;
  }
}
