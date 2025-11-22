import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * Excalidraw - Virtual whiteboard for sketching
 */
export class ExcalidrawService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Excalidraw',
      ServiceType.EXCALIDRAW,
      false,
      [],
      config,
      templateEngine
    );
  }

  protected async generateConfigFiles(): Promise<void> {
    console.log('Excalidraw uses environment variable configuration');
  }

  getAccessUrl(): string {
    return `http://${this.config.ip}:80`;
  }
}
