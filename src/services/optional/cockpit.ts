import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * Cockpit CMS with FrankenPHP
 * Headless CMS powered by FrankenPHP (PHP + Caddy)
 */
export class CockpitService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Cockpit',
      ServiceType.COCKPIT,
      false,
      [],
      config,
      templateEngine
    );
  }

  protected async generateConfigFiles(): Promise<void> {
    console.log('Cockpit CMS with FrankenPHP configured.');
    console.log('Access Cockpit at http://<ip>:8081/install to complete setup.');
  }

  getAccessUrl(): string {
    return `http://${this.config.ip}:8081`;
  }
}
