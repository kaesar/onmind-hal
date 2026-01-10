import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class DrawIOService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Draw.io',
      ServiceType.DRAWIO,
      false, // not a core service
      [], // no dependencies
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://drawio.${this.config.domain}`;
  }
}