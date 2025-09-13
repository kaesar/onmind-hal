import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * Redis in-memory database service implementation
 * Provides caching and session storage capabilities
 */
export class RedisService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Redis',
      ServiceType.REDIS,
      false, // isCore = false (optional service)
      [], // no dependencies
      config,
      templateEngine
    );
  }

  /**
   * Redis uses default configuration with persistence enabled, no custom config files needed
   */
  protected async generateConfigFiles(): Promise<void> {
    // Redis configuration is handled through command line arguments in the Docker run command
    // We enable AOF persistence with --appendonly yes
    console.log('Redis uses command line configuration with AOF persistence enabled');
  }

  /**
   * Get Redis connection URL
   */
  getAccessUrl(): string {
    return `redis://${this.config.ip}:6379`;
  }
}