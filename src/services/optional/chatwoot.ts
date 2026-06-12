import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class ChatwootService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Chatwoot',
      ServiceType.CHATWOOT,
      false,
      [ServiceType.POSTGRESQL, ServiceType.REDIS],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://chatwoot.${this.config.domain}`;
  }
}
