import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * Floci AWS service emulator implementation
 */
export class FlociService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Floci',
      ServiceType.FLOCI,
      false,
      [],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `http://floci.${this.config.domain}:4566`;
  }
}