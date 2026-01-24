import { ServiceType, HomelabConfig } from '../../core/types.js';
import { ServiceInstallationError } from '../../utils/errors.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class ApisixService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Apache APISIX',
      ServiceType.APISIX,
      false,
      [],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://apisix.${this.config.domain}`;
  }
}
