import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * OrcaRouter Lite LLM router service implementation
 */
export class OrcaRouterLiteService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'OrcaRouter Lite',
      ServiceType.ORCAROUTERLITE,
      false,
      [],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://orcarouter.${this.config.domain}/v1`;
  }
}