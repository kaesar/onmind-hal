import { ServiceType, HomelabConfig } from '../../core/types.js';
import { ServiceInstallationError } from '../../utils/errors.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class GrafanaService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Grafana',
      ServiceType.GRAFANA,
      false,
      [],
      config,
      templateEngine
    );
  }

  async install(): Promise<void> {
    try {
      await this.executeTemplate('services/grafana');
      this.logger.info('✅ Grafana installed successfully');
    } catch (error) {
      throw new ServiceInstallationError(
        ServiceType.GRAFANA,
        `Installation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  getAccessUrl(): string {
    return `http://${this.config.ip}:3001`;
  }
}
