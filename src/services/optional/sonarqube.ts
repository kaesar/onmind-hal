import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * SonarQube CE - Code quality and security analysis
 */
export class SonarQubeService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'SonarQube',
      ServiceType.SONARQUBE,
      false,
      [],
      config,
      templateEngine
    );
  }

  protected async generateConfigFiles(): Promise<void> {
    console.log('SonarQube uses environment variable configuration');
  }

  getAccessUrl(): string {
    return `http://${this.config.ip}:9000`;
  }
}
