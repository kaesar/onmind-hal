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

  getAccessUrl(): string {
    return `smtp://${this.config.ip}:25`;
  }
}
