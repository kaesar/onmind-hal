import { ServiceType, HomelabConfig } from '../../core/types.js';
import { ServiceInstallationError } from '../../utils/errors.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class BackstageService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Backstage',
      ServiceType.BACKSTAGE,
      false,
      [ServiceType.POSTGRESQL],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://backstage.${this.config.domain}`;
  }
}
