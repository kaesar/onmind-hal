import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class OpenWebUIService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Open WebUI',
      ServiceType.OPENWEBUI,
      false,
      ['Ollama'],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://openwebui.${this.config.domain}`;
  }
}
