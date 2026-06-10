import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class FlociAZService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Floci-AZ',
      ServiceType.FLOCIAZ,
      false,
      [],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `http://flociaz.${this.config.domain}:4567`;
  }
}
