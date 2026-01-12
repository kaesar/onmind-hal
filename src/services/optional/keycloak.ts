import { BaseService } from '../base.js';
import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';

/**
 * Keycloak service - Open-source identity and access management
 */
export class KeycloakService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Keycloak',
      ServiceType.KEYCLOAK,
      false, // not core
      [], // no dependencies
      config,
      templateEngine
    );
  }
}