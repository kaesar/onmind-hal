import { ServiceType, HomelabConfig } from '../../core/types.js';
import { ServiceInstallationError } from '../../utils/errors.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class MailserverService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Docker Mailserver',
      ServiceType.MAILSERVER,
      false,
      [],
      config,
      templateEngine
    );
  }

  async install(): Promise<void> {
    try {
      await this.executeTemplate('services/mailserver');
      this.logger.info('✅ Docker Mailserver installed successfully');
    } catch (error) {
      throw new ServiceInstallationError(
        ServiceType.MAILSERVER,
        `Installation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  getAccessUrl(): string {
    return `smtp://${this.config.ip}:25`;
  }
}
