import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * OpenClaw AI agent gateway service implementation
 */
export class OpenClawService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'OpenClaw',
      ServiceType.OPENCLAW,
      false,
      [],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://openclaw.${this.config.domain}`;
  }
}