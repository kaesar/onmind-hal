import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class CloudflaredService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Cloudflare Tunnel',
      ServiceType.CLOUDFLARED,
      false,
      ['Caddy'],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return 'https://dash.cloudflare.com (Cloudflare Dashboard)';
  }
}
