import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * PocketID OIDC provider with passkeys support
 * Designed to work with Caddy + oauth2-proxy
 */
export class PocketIDService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'PocketID',
      ServiceType.POCKETID,
      false,
      [],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://auth.${this.config.domain}`;
  }
}
