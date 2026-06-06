import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * Infisical secrets management platform service implementation
 */
export class InfisicalService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Infisical',
      ServiceType.INFISCAL,
      false,
      ['PostgreSQL', 'Redis'],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://infisical.${this.config.domain}`;
  }
}