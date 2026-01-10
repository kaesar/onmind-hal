import { ServiceType, HomelabConfig } from '../../core/types.js';
import { ServiceInstallationError } from '../../utils/errors.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class FluentBitService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Fluent Bit',
      ServiceType.FLUENTBIT,
      false,
      [],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `http://${this.config.ip}:2020`;
  }
}
