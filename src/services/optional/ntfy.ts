import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class NtfyService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Ntfy',
      ServiceType.NTFY,
      false,
      [],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://ntfy.${this.config.domain}`;
  }
}
