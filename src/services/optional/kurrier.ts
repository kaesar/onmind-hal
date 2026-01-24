import { ServiceType, HomelabConfig } from '../../core/types.js';
import { ServiceInstallationError } from '../../utils/errors.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class KurrierService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Kurrier',
      ServiceType.KURRIER,
      false,
      [],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://kurrier.${this.config.domain}`;
  }
}
