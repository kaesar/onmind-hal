import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class CockpitService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Cockpit CMS',
      ServiceType.COCKPIT,
      false, // optional service
      [],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://cockpit.${this.config.domain}`;
  }
}