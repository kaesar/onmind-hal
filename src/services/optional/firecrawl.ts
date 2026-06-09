import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * Firecrawl web scraping API service implementation
 */
export class FirecrawlService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Firecrawl',
      ServiceType.FIRECRAWL,
      false,
      ['PostgreSQL', 'Redis', 'RabbitMQ'],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://firecrawl.${this.config.domain}`;
  }
}