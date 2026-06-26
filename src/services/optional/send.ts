import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * Send - Simple, private file sharing with end-to-end encryption
 * Fork of Mozilla Firefox Send
 */
export class SendService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Send',
      ServiceType.SEND,
      false,
      ['Redis'],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://send.${this.config.domain}`;
  }
}
