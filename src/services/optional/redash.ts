import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * ReDash SQL query editor and visualization platform service implementation
 */
export class RedashService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'ReDash',
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