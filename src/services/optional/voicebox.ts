import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class VoiceboxService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Voicebox',
      ServiceType.VOICEBOX,
      false,
      [],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://voicebox.${this.config.domain}`;
  }
}
