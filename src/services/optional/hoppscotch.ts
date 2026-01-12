import { BaseService } from '../base.js';
import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';

/**
 * Hoppscotch service - Open-source API development ecosystem
 */
export class HoppscotchService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Hoppscotch',
      ServiceType.HOPPSCOTCH,
      false, // not core
      [], // no dependencies
      config,
      templateEngine
    );
  }
}