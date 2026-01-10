import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * OneDev - Self-hosted Git server with CI/CD
 */
export class OneDevService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'OneDev',
      ServiceType.ONEDEV,
      false,
      [],
      config,
      templateEngine
    );
  }

  protected async generateConfigFiles(): Promise<void> {
    console.log('OneDev uses environment variable configuration');
  }

  getAccessUrl(): string {
    return `https://onedev.${this.config.domain}`;
  }
}
