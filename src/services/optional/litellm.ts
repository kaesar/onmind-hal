import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * LiteLLM proxy service implementation
 */
export class LiteLLMService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'LiteLLM',
      ServiceType.LITELLM,
      false,
      ['PostgreSQL', 'Redis'],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://litellm.${this.config.domain}`;
  }
}