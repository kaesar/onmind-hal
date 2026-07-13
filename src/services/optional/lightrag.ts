import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * LightRAG graph-based RAG service implementation
 */
export class LightRAGService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'LightRAG',
      ServiceType.LIGHTRAG,
      false,
      ['Ollama', 'PostgreSQL', 'Redis'],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://lightrag.${this.config.domain}`;
  }
}
