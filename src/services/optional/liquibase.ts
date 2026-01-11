import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * Liquibase service implementation - Database schema change management
 */
export class LiquibaseService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Liquibase',
      ServiceType.LIQUIBASE,
      false, // not a core service
      [], // no dependencies
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://liquibase.${this.config.domain}`;
  }
}
