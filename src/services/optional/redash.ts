import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * Redash SQL query editor and visualization platform service implementation
 */
export class RedashService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Redash',
      ServiceType.REDASH,
      false,
      ['PostgreSQL', 'Redis'],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://redash.${this.config.domain}`;
  }
}