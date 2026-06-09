import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class DockhandService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super('Dockhand', ServiceType.DOCKHAND, true, [], config, templateEngine);
  }

  getAccessUrl(): string {
    return `https://dockhand.${this.config.domain}`;
  }
}
