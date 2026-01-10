import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class KeystoneJSService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'KeystoneJS',
      ServiceType.KEYSTONEJS,
      false, // not a core service
      [ServiceType.POSTGRESQL], // requires PostgreSQL
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://keystonejs.${this.config.domain}`;
  }
}