import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * OpenHuman AI agent platform service implementation
 */
export class OpenHumanService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'OpenHuman',
      ServiceType.OPENHUMAN,
      false,
      [],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://openhuman.${this.config.domain}`;
  }
}