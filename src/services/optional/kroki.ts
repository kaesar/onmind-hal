import { ServiceType, HomelabConfig } from '../../core/types.js';
import { ServiceInstallationError } from '../../utils/errors.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class KrokiService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Kroki',
      ServiceType.KROKI,
      false,
      [],
      config,
      templateEngine
    );
  }

  async install(): Promise<void> {
    try {
      await this.executeTemplate('services/kroki');
      this.logger.info('✅ Kroki installed successfully');
    } catch (error) {
      throw new ServiceInstallationError(
        ServiceType.KROKI,
        `Installation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  getAccessUrl(): string {
    return `http://${this.config.ip}:8086`;
  }
}
