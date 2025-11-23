import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * PsiTransfer - File sharing like WeTransfer
 */
export class PsiTransferService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'PsiTransfer',
      ServiceType.PSITRANSFER,
      false,
      [],
      config,
      templateEngine
    );
  }

  protected async generateConfigFiles(): Promise<void> {
    console.log('PsiTransfer uses environment variable configuration');
  }

  getAccessUrl(): string {
    return `http://${this.config.ip}:3000`;
  }
}
