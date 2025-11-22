import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * Apache Kafka distributed streaming platform
 */
export class KafkaService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Kafka',
      ServiceType.KAFKA,
      false,
      [],
      config,
      templateEngine
    );
  }

  protected async generateConfigFiles(): Promise<void> {
    console.log('Kafka uses environment variable configuration');
  }

  getAccessUrl(): string {
    return `kafka://${this.config.ip}:9092`;
  }
}
