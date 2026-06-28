import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class ArcaneService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super('Arcane', ServiceType.ARCANE, true, [], config, templateEngine);
  }

  getAccessUrl(): string {
    return `https://arcane.${this.config.domain}`;
  }
}
