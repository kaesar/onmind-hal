import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class StirlingPDFService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Stirling-PDF',
      ServiceType.STIRLINGPDF,
      false, // not a core service
      [], // no dependencies
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://pdf.${this.config.domain}`;
  }
}