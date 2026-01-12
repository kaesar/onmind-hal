import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class VaultwardenService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Vaultwarden',
      ServiceType.VAULTWARDEN,
      false, // optional service
      [],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://vaultwarden.${this.config.domain}`;
  }
}