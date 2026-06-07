import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * RustDesk Server remote desktop service implementation
 */
export class RustDeskService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'RustDesk Server',
      ServiceType.RUSTDESK,
      false,
      [],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://rustdesk.${this.config.domain}`;
  }
}