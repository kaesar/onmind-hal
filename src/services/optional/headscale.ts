import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * Headscale - Self-hosted VPN server (Tailscale control server)
 * Provides WireGuard-based mesh VPN for remote access to HomeLab
 */
export class HeadscaleService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Headscale',
      ServiceType.HEADSCALE,
      false,
      [],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://headscale.${this.config.domain}`;
  }
}
