import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class CaldiyService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Cal.diy',
      ServiceType.CALDIY,
      false,
      [ServiceType.POSTGRESQL],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://cal.${this.config.domain}`;
  }
}
