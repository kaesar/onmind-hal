import { ServiceType, HomelabConfig } from '../../core/types.js';
import { ServiceInstallationError } from '../../utils/errors.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class MattermostService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Mattermost',
      ServiceType.MATTERMOST,
      false,
      [ServiceType.POSTGRESQL],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://mattermost.${this.config.domain}`;
  }
}
