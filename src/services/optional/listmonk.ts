import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class ListmonkService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Listmonk',
      ServiceType.LISTMONK,
      false,
      ['PostgreSQL'],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://listmonk.${this.config.domain}`;
  }
}
