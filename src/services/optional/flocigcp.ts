import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class FlociGCPService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Floci-GCP',
      ServiceType.FLOCIGCP,
      false,
      [],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `http://flocigcp.${this.config.domain}:4568`;
  }
}
