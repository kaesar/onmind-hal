import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * Tinyauth v5 - Lightweight OIDC authentication server
 * Supports OAuth, LDAP, TOTP and works with Caddy reverse proxy
 */
export class TinyauthService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Tinyauth',
      ServiceType.TINYAUTH,
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
