import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class KafkauiService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Kafka UI',
      ServiceType.KAFKAUI,
      false,
      ['Kafka'],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://kafkaui.${this.config.domain}`;
  }
}
