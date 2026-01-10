import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * HashiCorp Vault - Secrets management
 */
export class VaultService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Vault',
      ServiceType.VAULT,
      false,
      [],
      config,
      templateEngine
    );
  }

  protected async generateConfigFiles(): Promise<void> {
    console.log('Vault uses environment variable configuration');
  }

  getAccessUrl(): string {
    return `https://vault.${this.config.domain}`;
  }
}
