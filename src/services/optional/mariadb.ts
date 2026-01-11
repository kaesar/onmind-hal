import { ServiceType, HomelabConfig } from '../../core/types.js';
import { ServiceInstallationError } from '../../utils/errors.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * MariaDB database service implementation
 * Provides relational database capabilities for other services
 */
export class MariaDBService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'MariaDB',
      ServiceType.MARIADB,
      false, // isCore = false (optional service)
      [], // no dependencies
      config,
      templateEngine
    );
  }

  /**
   * Validate MariaDB configuration before installation
   */
  async install(): Promise<void> {
    // Validate that mariadb password is set
    if (!this.config.storagePassword || this.config.storagePassword.trim() === '') {
      throw new ServiceInstallationError(
        ServiceType.MARIADB,
        'MariaDB password is required but not provided in configuration'
      );
    }

    // Call parent install method
    await super.install();
  }

  /**
   * MariaDB uses environment variables for configuration, no custom config files needed
   */
  protected async generateConfigFiles(): Promise<void> {
    // MariaDB configuration is handled through environment variables in the Docker run command
    console.log('MariaDB uses environment variable configuration');
  }

  /**
   * Get MariaDB connection URL
   */
  getAccessUrl(): string {
    if (!this.config.storagePassword) {
      return 'mysql://homelab:PASSWORD_NOT_SET@' + this.config.ip + ':3306/homelab';
    }
    return `mysql://homelab:${this.config.storagePassword}@${this.config.ip}:3306/homelab`;
  }

  /**
   * Override getTemplateContext to ensure mariadb password is available
   */
  protected getTemplateContext(): Record<string, any> {
    const context = super.getTemplateContext();
    
    if (!this.config.storagePassword) {
      throw new ServiceInstallationError(
        ServiceType.MARIADB,
        'MariaDB password is required for template rendering'
      );
    }
    
    return context;
  }
}