import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * AnythingLLM AI platform service implementation
 */
export class AnythingLLMService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'AnythingLLM',
      ServiceType.ANYTHINGLLM,
      false,
      ['Ollama'],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://anythingllm.${this.config.domain}`;
  }
}