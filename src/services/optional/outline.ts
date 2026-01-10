import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';
import { $ } from 'bun';

/**
 * Outline - Team knowledge base and wiki
 */
export class OutlineService extends BaseService {
  private secretKey: string = '';
  private utilsSecret: string = '';

  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Outline',
      ServiceType.OUTLINE,
      false,
      [ServiceType.POSTGRESQL, ServiceType.REDIS],
      config,
      templateEngine
    );
  }

  protected async generateConfigFiles(): Promise<void> {
    // Generate 64-character hexadecimal secrets
    const secretKeyResult = await $`openssl rand -hex 32`.quiet();
    const utilsSecretResult = await $`openssl rand -hex 32`.quiet();
    
    this.secretKey = secretKeyResult.stdout.toString().trim();
    this.utilsSecret = utilsSecretResult.stdout.toString().trim();
    
    console.log('Generated Outline secrets (SECRET_KEY and UTILS_SECRET)');
  }

  protected getTemplateContext(): Record<string, any> {
    const context = super.getTemplateContext();
    return {
      ...context,
      SECRET_KEY: this.secretKey,
      UTILS_SECRET: this.utilsSecret
    };
  }

  getAccessUrl(): string {
    return `https://outline.${this.config.domain}`;
  }
}
