import { ServiceType, HomelabConfig } from '../../core/types.js';
import { ServiceInstallationError } from '../../utils/errors.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * PostgreSQL database service implementation
 * Provides relational database capabilities for other services
 */
export class PostgreSQLService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'PostgreSQL',
      ServiceType.POSTGRESQL,
      false, // isCore = false (optional service)
      [], // no dependencies
      config,
      templateEngine
    );
  }

  /**
   * Validate PostgreSQL configuration before installation
   */
  async install(): Promise<void> {
    // Validate that postgres password is set
    if (!this.config.storagePassword || this.config.storagePassword.trim() === '') {
      throw new ServiceInstallationError(
        ServiceType.POSTGRESQL,
        'PostgreSQL password is required but not provided in configuration'
      );
    }

    // Call parent install method
    await super.install();
  }

  /**
   * PostgreSQL uses environment variables for configuration, no custom config files needed
   */
  protected async generateConfigFiles(): Promise<void> {
    // PostgreSQL configuration is handled through environment variables in the Docker run command
    console.log('PostgreSQL uses environment variable configuration');
  }

  /**
   * Get PostgreSQL connection URL
   */
  getAccessUrl(): string {
    if (!this.config.storagePassword) {
      return 'postgresql://homelab:PASSWORD_NOT_SET@' + this.config.ip + ':5432/homelab';
    }
    return `postgresql://homelab:${this.config.storagePassword}@${this.config.ip}:5432/homelab`;
  }

  /**
   * Override getTemplateContext to ensure postgres password is available
   */
  protected getTemplateContext(): Record<string, any> {
    const context = super.getTemplateContext();
    
    if (!this.config.storagePassword) {
      throw new ServiceInstallationError(
        ServiceType.POSTGRESQL,
        'PostgreSQL password is required for template rendering'
      );
    }
    
    return context;
  }
}