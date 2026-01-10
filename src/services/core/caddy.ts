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
      const homeDir = process.env.HOME || process.env.USERPROFILE || '~';
      const configDir = join(homeDir, 'wsconf');
      
      // Create config directory
      await mkdir(configDir, { recursive: true });

      // Detect template based on OS and domain
      const templateName = this.selectCaddyTemplate();
      
      // Load Caddyfile template
      const caddyTemplate = await this.templateEngine.load(templateName);
      const context = this.getTemplateContext();
      
      // Add service-specific context for Caddyfile
      const caddyContext = {
        ...context,
        services: this.getServiceProxyConfig()
      };

      // Render Caddyfile
      const caddyfileContent = this.templateEngine.render(caddyTemplate, caddyContext);
      
      // Parse the JSON string and convert \\n to actual newlines
      const parsedContent = JSON.parse(caddyfileContent);
      const finalContent = parsedContent.replace(/\\\\n/g, '\n');
      
      // Write Caddyfile
      const caddyfilePath = join(configDir, 'Caddyfile');
      await writeFile(caddyfilePath, finalContent);
      
      console.log(`Generated Caddyfile at ${caddyfilePath} (${this.getCertificateType()})`);
    } catch (error) {
      throw new Error(`Failed to generate Caddyfile: ${error}`);
    }
  }

  /**
   * Select appropriate Caddyfile template based on OS and domain
   */
  private selectCaddyTemplate(): string {
    const isMacOS = process.platform === 'darwin';
    const isLocalDomain = this.isLocalDomain(this.config.domain);
    
    // Use self-signed certificates for macOS or local domains
    if (isMacOS || isLocalDomain) {
      return 'config/caddyfile-self-signed';
    } else {
      return 'config/caddyfile';
    }
  }

  /**
   * Check if domain is local (.lan, .local, localhost, or private IP ranges)
   */
  private isLocalDomain(domain: string): boolean {
    const localTlds = ['.lan', '.local', 'localhost'];
    
    // Check for explicit local TLDs
    if (localTlds.some(tld => domain.endsWith(tld))) {
      return true;
    }
    
    // Check if IP is in private ranges
    const ip = this.config.ip;
    if (this.isPrivateIP(ip)) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if IP is in private ranges (RFC 1918)
   */
  private isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^10\./,                    // 10.0.0.0/8
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // 172.16.0.0/12
      /^192\.168\./,              // 192.168.0.0/16
      /^127\./,                   // 127.0.0.0/8 (localhost)
    ];
    
    return privateRanges.some(range => range.test(ip));
  }

  /**
   * Get certificate type description
   */
  private getCertificateType(): string {
    const isMacOS = process.platform === 'darwin';
    const isLocalDomain = this.isLocalDomain(this.config.domain);
    
    if (isMacOS || isLocalDomain) {
      return 'self-signed certificates';
    } else {
      return 'Let\'s Encrypt certificates';
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
      [ServiceType.REDIS]: null, // No web interface
      [ServiceType.MONGODB]: null, // No web interface
      [ServiceType.MARIADB]: null, // No web interface
      [ServiceType.MINIO]: null, // No web interface
      [ServiceType.OLLAMA]: null, // No web interface
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