import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * MedusaJS - Headless e-commerce platform
 * Open-source alternative to Shopify
 */
export class MedusaJSService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'MedusaJS',
      ServiceType.MEDUSAJS,
      false,
      [ServiceType.POSTGRESQL, ServiceType.REDIS],
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://shop.${this.config.domain}`;
  }
}
