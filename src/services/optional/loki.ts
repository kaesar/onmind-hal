import { ServiceType, HomelabConfig } from '../../core/types.js';
import { ServiceInstallationError } from '../../utils/errors.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class LokiService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Loki',
      ServiceType.LOKI,
      false,
      [],
      config,
      templateEngine
    );
  }

  async install(): Promise<void> {
    try {
      await this.executeTemplate('services/loki');
      this.logger.info('✅ Loki installed successfully');
    } catch (error) {
      throw new ServiceInstallationError(
        ServiceType.LOKI,
        `Installation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  getAccessUrl(): string {
    return `http://${this.config.ip}:3100`;
  }
}
