import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * RabbitMQ - Message broker
 */
export class RabbitMQService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'RabbitMQ',
      ServiceType.RABBITMQ,
      false,
      [],
      config,
      templateEngine
    );
  }

  protected async generateConfigFiles(): Promise<void> {
    console.log('RabbitMQ uses environment variable configuration');
  }

  getAccessUrl(): string {
    return `http://${this.config.ip}:15672`;
  }
}
