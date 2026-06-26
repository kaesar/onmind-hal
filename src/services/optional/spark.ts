import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class SparkService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Apache Spark',
      ServiceType.SPARK,
      false,
      [],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://spark.${this.config.domain}`;
  }
}
