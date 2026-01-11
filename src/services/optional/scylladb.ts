import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class ScyllaDBService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'ScyllaDB',
      ServiceType.SCYLLADB,
      false,
      [],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `cql://${this.config.ip}:9042`;
  }
}