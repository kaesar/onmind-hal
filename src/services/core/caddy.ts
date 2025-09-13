import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

/**
 * Caddy reverse proxy service implementation
 * Handles reverse proxy configuration for all HomeLab services
 */
export class CaddyService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Caddy',
      ServiceType.CADDY,
      true, // isCore
      [], // no dependencies
      config,
      templateEngine
    );
  }

  /**
   * Generate Caddyfile configuration
   */
  protected async generateConfigFiles(): Promise<void> {
    try {
      // Create config directory
      await mkdir('/opt/caddy/config', { recursive: true });

      // Load Caddyfile template
      const caddyTemplate = await this.templateEngine.load('config/caddyfile');
      const context = this.getTemplateContext();
      
      // Add service-specific context for Caddyfile
      const caddyContext = {
        ...context,
        services: this.getServiceProxyConfig()
      };

      // Render Caddyfile
      const caddyfileContent = this.templateEngine.render(caddyTemplate, caddyContext);
      
      // Write Caddyfile
      const caddyfilePath = '/opt/caddy/config/Caddyfile';
      await writeFile(caddyfilePath, caddyfileContent);
      
      console.log(`Generated Caddyfile at ${caddyfilePath}`);
    } catch (error) {
      throw new Error(`Failed to generate Caddyfile: ${error}`);
    }
  }

  /**
   * Get proxy configuration for selected services
   */
  private getServiceProxyConfig(): Array<{name: string, subdomain: string, port: number}> {
    const serviceProxyMap = {
      [ServiceType.PORTAINER]: { subdomain: 'portainer', port: 9000 },
      [ServiceType.COPYPARTY]: { subdomain: 'files', port: 3923 },
      [ServiceType.N8N]: { subdomain: 'n8n', port: 5678 },
      [ServiceType.POSTGRESQL]: null, // No web interface
      [ServiceType.REDIS]: null // No web interface
    };

    return this.config.selectedServices
      .map(serviceType => {
        const proxyConfig = serviceProxyMap[serviceType];
        if (proxyConfig) {
          return {
            name: serviceType,
            subdomain: proxyConfig.subdomain,
            port: proxyConfig.port
          };
        }
        return null;
      })
      .filter(config => config !== null) as Array<{name: string, subdomain: string, port: number}>;
  }

  /**
   * Override getAccessUrl to return main domain
   */
  getAccessUrl(): string {
    return `https://${this.config.domain}`;
  }
}