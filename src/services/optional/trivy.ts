import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * Trivy - Container security scanner
 */
export class TrivyService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Trivy',
      ServiceType.TRIVY,
      false,
      [],
      config,
      templateEngine
    );
  }

  protected async generateConfigFiles(): Promise<void> {
    console.log('Trivy uses environment variable configuration');
  }

  getAccessUrl(): string {
    return `http://${this.config.ip}:8080`;
  }
}
