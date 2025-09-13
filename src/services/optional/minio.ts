import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * Minio S3-compatible object storage service implementation
 * Provides object storage capabilities
 */
export class MinioService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Minio',
      ServiceType.MINIO,
      false, // isCore = false (optional service)
      [], // no dependencies
      config,
      templateEngine
    );
  }

  /**
   * Minio uses environment variables for configuration, no custom config files needed
   */
  protected async generateConfigFiles(): Promise<void> {
    // Minio configuration is handled through environment variables in the Docker run command
    console.log('Minio uses environment variable configuration');
  }

  /**
   * Get Minio access URL with subdomain
   */
  getAccessUrl(): string {
    return `https://minio.${this.config.domain}`;
  }
}