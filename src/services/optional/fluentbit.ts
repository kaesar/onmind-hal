import { ServiceType, HomelabConfig } from '../../core/types.js';
import { ServiceInstallationError } from '../../utils/errors.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class FluentBitService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Fluent Bit',
      ServiceType.FLUENTBIT,
      false,
      [],
      config,
      templateEngine
    );
  }

  async install(): Promise<void> {
    try {
      await this.executeTemplate('services/fluentbit');
      this.logger.info('✅ Fluent Bit installed successfully');
    } catch (error) {
      throw new ServiceInstallationError(
        ServiceType.FLUENTBIT,
        `Installation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  getAccessUrl(): string {
    return `http://${this.config.ip}:2020`;
  }
}
