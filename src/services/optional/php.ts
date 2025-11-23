import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * FrankenPHP - Modern PHP app server with Caddy built-in
 * Combines PHP and Caddy in a single container
 */
export class PHPService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'FrankenPHP',
      ServiceType.PHP,
      false,
      [],
      config,
      templateEngine
    );
  }

  protected async generateConfigFiles(): Promise<void> {
    console.log('FrankenPHP uses default configuration. Place PHP files in ~/wsdata/frankenphp/public/');
    console.log('Note: FrankenPHP runs on ports 8080 (HTTP) and 8443 (HTTPS) to avoid conflict with main Caddy.');
  }

  getAccessUrl(): string {
    return `http://${this.config.ip}:8080`;
  }
}
