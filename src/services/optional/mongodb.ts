import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * MongoDB NoSQL database service implementation
 * Provides document database capabilities
 */
export class MongoDBService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'MongoDB',
      ServiceType.MONGODB,
      false, // isCore = false (optional service)
      [], // no dependencies
      config,
      templateEngine
    );
  }

  /**
   * MongoDB uses environment variables for configuration, no custom config files needed
   */
  protected async generateConfigFiles(): Promise<void> {
    // MongoDB configuration is handled through environment variables in the Docker run command
    console.log('MongoDB uses environment variable configuration');
  }

  /**
   * Get MongoDB connection URL
   */
  getAccessUrl(): string {
    if (!this.config.databasePassword) {
      return `mongodb://admin:PASSWORD_NOT_SET@${this.config.ip}:27017/admin`;
    }
    return `mongodb://admin:${this.config.databasePassword}@${this.config.ip}:27017/admin`;
  }
}