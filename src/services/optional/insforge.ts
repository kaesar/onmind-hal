import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class InsForgeService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'InsForge',
      ServiceType.INSFORGE,
      false,
      [ServiceType.POSTGRESQL],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://insforge.${this.config.domain}`;
  }
}
