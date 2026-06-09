import { BaseService } from '../base.js';
import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';

export class KarateService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Karate',
      ServiceType.KARATE,
      false,
      [],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `vnc://karate.${this.config.domain}:5901`;
  }
}
