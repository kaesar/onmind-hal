import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * Semaphore UI service implementation - Modern UI for Ansible
 */
export class SemaphoreService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Semaphore UI',
      ServiceType.SEMAPHORE,
      false, // not a core service
      [], // no dependencies
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://semaphore.${this.config.domain}`;
  }
}
