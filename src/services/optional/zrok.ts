import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * Zrok tunneling platform service implementation
 */
export class ZrokService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Zrok',
      ServiceType.ZROK,
      false,
      ['PostgreSQL'],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://zrok.${this.config.domain}`;
  }
}