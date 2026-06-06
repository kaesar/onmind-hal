import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * OpenJarvis AI assistant platform service implementation
 */
export class OpenJarvisService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'OpenJarvis',
      ServiceType.OPENJARVIS,
      false,
      ['Ollama'],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://openjarvis.${this.config.domain}`;
  }
}