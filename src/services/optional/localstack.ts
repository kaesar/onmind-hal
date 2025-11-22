import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * LocalStack - Local AWS cloud stack
 */
export class LocalStackService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'LocalStack',
      ServiceType.LOCALSTACK,
      false,
      [],
      config,
      templateEngine
    );
  }

  protected async generateConfigFiles(): Promise<void> {
    console.log('LocalStack uses environment variable configuration');
  }

  getAccessUrl(): string {
    return `http://${this.config.ip}:4566`;
  }
}
