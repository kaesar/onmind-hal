import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * Open NotebookLM - Open-source alternative to Google NotebookLM
 * AI-powered note-taking and research assistant
 */
export class OpenNotebookLMService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Open NotebookLM',
      ServiceType.OPENNOTEBOOKLM,
      false,
      [],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://notebook.${this.config.domain}`;
  }
}
