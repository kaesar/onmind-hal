import { ServiceType, HomelabConfig } from '../../core/types.js';
import { ServiceInstallationError } from '../../utils/errors.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class QdrantService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Qdrant',
      ServiceType.QDRANT,
      false,
      [],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://qdrant.${this.config.domain}`;
  }
}
