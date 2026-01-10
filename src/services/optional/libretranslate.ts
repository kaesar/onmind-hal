import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * LibreTranslate - Free and open source machine translation API
 */
export class LibreTranslateService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'LibreTranslate',
      ServiceType.LIBRETRANSLATE,
      false,
      [],
      config,
      templateEngine
    );
  }

  protected async generateConfigFiles(): Promise<void> {
    console.log('LibreTranslate uses environment variable configuration');
  }

  getAccessUrl(): string {
    return `https://libretranslate.${this.config.domain}`;
  }
}