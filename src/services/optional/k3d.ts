import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * k3d service implementation - Lightweight Kubernetes in Docker
 */
export class K3dService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'k3d',
      ServiceType.K3D,
      false, // not a core service
      [], // no dependencies
      config,
      templateEngine
    );
  }

  getAccessUrl(): string {
    return `https://k3d.${this.config.domain}`;
  }
}
