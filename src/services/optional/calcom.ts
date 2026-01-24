import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class CalcomService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Cal.com',
      ServiceType.CALCOM,
      false,
      ['PostgreSQL'],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://cal.${this.config.domain}`;
  }
}
