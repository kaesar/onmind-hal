import { ServiceType, HomelabConfig } from '../../core/types.js';
import { ServiceInstallationError } from '../../utils/errors.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class NocoDBService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'NocoDB',
      ServiceType.NOCODB,
      false,
      [],
      config,
      templateEngine
    );
  }

  async install(): Promise<void> {
    try {
      await this.executeTemplate('services/nocodb');
      this.logger.info('✅ NocoDB installed successfully');
    } catch (error) {
      throw new ServiceInstallationError(
        ServiceType.NOCODB,
        `Installation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  getAccessUrl(): string {
    return `http://${this.config.ip}:8083`;
  }
}
