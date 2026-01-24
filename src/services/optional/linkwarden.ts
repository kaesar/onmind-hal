import { ServiceType, HomelabConfig } from '../../core/types.js';
import { ServiceInstallationError } from '../../utils/errors.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class LinkwardenService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Linkwarden',
      ServiceType.LINKWARDEN,
      false,
      [ServiceType.POSTGRESQL],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://linkwarden.${this.config.domain}`;
  }
}
