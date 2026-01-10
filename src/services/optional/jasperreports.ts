import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class JasperReportsService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'JasperReports Server',
      ServiceType.JASPERREPORTS,
      false, // not a core service
      [ServiceType.POSTGRESQL], // requires PostgreSQL
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://jasperreports.${this.config.domain}`;
  }
}