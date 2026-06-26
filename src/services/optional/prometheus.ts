import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class PrometheusService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Prometheus',
      ServiceType.PROMETHEUS,
      false,
      [],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://prometheus.${this.config.domain}`;
  }
}
