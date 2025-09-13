import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * Ollama LLM server service implementation
 * Provides local large language model capabilities
 */
export class OllamaService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Ollama',
      ServiceType.OLLAMA,
      false, // isCore = false (optional service)
      [], // no dependencies
      config,
      templateEngine
    );
  }

  /**
   * Ollama uses default configuration, no custom config files needed
   */
  protected async generateConfigFiles(): Promise<void> {
    // Ollama configuration is handled through environment variables and volumes
    console.log('Ollama uses default configuration with persistent volume');
  }

  /**
   * Get Ollama access URL with subdomain
   */
  getAccessUrl(): string {
    return `https://ollama.${this.config.domain}`;
  }
}