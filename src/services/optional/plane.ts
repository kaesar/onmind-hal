import { ServiceType, HomelabConfig } from '../../core/types.js';
import { ServiceInstallationError } from '../../utils/errors.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';
import { PlatformUtils } from '../../utils/platform.js';

export class PlaneService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Plane',
      ServiceType.PLANE,
      false,
      [ServiceType.POSTGRESQL, ServiceType.REDIS],
      config,
      templateEngine
    );
  }

  async install(): Promise<void> {
    // Check architecture compatibility
    if (await PlatformUtils.isARM64()) {
      console.log('⚠️  WARNING: Plane service may not work properly on ARM64 architecture');
      console.log('   The Docker images are built for AMD64 architecture and may fail to start.');
      console.log('   Consider using an x86_64 system or VM for better compatibility.');
      
      const proceed = await this.promptToContinue();
      if (!proceed) {
        throw new ServiceInstallationError(
          this.type,
          'Installation cancelled due to architecture incompatibility'
        );
      }
    }

    await super.install();
  }

  private async promptToContinue(): Promise<boolean> {
    // For now, return true to continue. In a real implementation,
    // you might want to add an interactive prompt here
    return true;
  }

  getAccessUrl(): string {
    return `https://plane.${this.config.domain}`;
  }
}