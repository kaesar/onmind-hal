import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * Directus headless CMS service implementation
 */
export class DirectusService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Directus',
      ServiceType.DIRECTUS,
      false,
      ['PostgreSQL', 'Redis'],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://directus.${this.config.domain}`;
  }
}