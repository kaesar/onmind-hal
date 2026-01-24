import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class IgniteService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Apache Ignite',
      ServiceType.IGNITE,
      false,
      [],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `jdbc:ignite:thin://${this.config.ip}:10800`;
  }
}
