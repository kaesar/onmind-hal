import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * TwentyCRM - Modern open-source CRM platform
 * Alternative to Salesforce with modern UI
 */
export class TwentyCRMService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'TwentyCRM',
      ServiceType.TWENTYCRM,
      false,
      [ServiceType.POSTGRESQL, ServiceType.REDIS],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://crm.${this.config.domain}`;
  }
}
