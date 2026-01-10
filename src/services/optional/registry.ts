import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * Docker Registry - Private container registry
 */
export class RegistryService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Registry',
      ServiceType.REGISTRY,
      false,
      [],
      config,
      templateEngine
    );
  }

  protected async generateConfigFiles(): Promise<void> {
    console.log('Registry uses environment variable configuration');
  }

  getAccessUrl(): string {
    return `https://registry.${this.config.domain}`;
  }
}
