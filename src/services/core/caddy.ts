import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';
import { writeFile, mkdir } from 'fs/promises';
import { NetworkUtils } from '../../utils/network.js';
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

      // Generate dynamic Caddyfile content
      const caddyfileContent = this.generateDynamicCaddyfile();
      
      // Write Caddyfile
      const caddyfilePath = join(configDir, 'Caddyfile');
      await writeFile(caddyfilePath, caddyfileContent);
      
      console.log(`Generated Caddyfile at ${caddyfilePath} (${this.getCertificateType()})`);
    } catch (error) {
      throw new Error(`Failed to generate Caddyfile: ${error}`);
    }
  }

  /**
   * Generate dynamic Caddyfile content based on selected services
   */
  private generateDynamicCaddyfile(): string {
    const isMacOS = process.platform === 'darwin';
    const isLocalDomain = NetworkUtils.isLocalDomain(this.config.domain, this.config.ip);
    
    const services = this.getServiceProxyConfig();
    
    let content = '# Caddyfile for HomeLab services\n\n';
    
    // Global options - NO local_certs para Linux con dominios locales
    if (!isLocalDomain || isMacOS) {
      content += '{\n';
      if (isMacOS && isLocalDomain) {
        content += '    # Use self-signed certificates for local development on macOS\n';
        content += '    local_certs\n';
      } else {
        content += '    # Email for Let\'s Encrypt\n';
        content += `    email admin@${this.config.domain}\n`;
      }
      content += '}\n\n';
    }
    
    // Main domain redirect to portainer
    content += `# Main domain redirect\n`;
    content += `${this.config.domain} {\n`;
    content += `    redir https://portainer.${this.config.domain}\n`;
    content += '}\n\n';
    
    // Generate proxy configurations for selected services
    if (services.length > 0) {
      content += '# Installed Services\n';
      for (const service of services) {
        content += `${service.subdomain}.${this.config.domain} {\n`;
        content += `    reverse_proxy ${service.container}:${service.port}\n`;
        content += '}\n\n';
      }
    }
    
    return content;
  }



  /**
   * Get certificate type description
   */
  private getCertificateType(): string {
    const isMacOS = process.platform === 'darwin';
    const isLocalDomain = NetworkUtils.isLocalDomain(this.config.domain, this.config.ip);
    
    if (isLocalDomain && !isMacOS) {
      return 'CA-signed certificates (system trust store)';
    } else if (isMacOS && isLocalDomain) {
      return 'self-signed certificates';
    } else {
      return 'Let\'s Encrypt certificates';
    }
  }

  /**
   * Get proxy configuration for selected services
   */
  private getServiceProxyConfig(): Array<{name: string, subdomain: string, port: number, container: string}> {
    const serviceProxyMap = {
      // Core services
      [ServiceType.PORTAINER]: { subdomain: 'portainer', port: 9000, container: 'portainer' },
      [ServiceType.COPYPARTY]: { subdomain: 'files', port: 3923, container: 'copyparty' },
      [ServiceType.DUCKDB]: { subdomain: 'duckdb', port: 80, container: 'duckdb' },
      
      // Optional services with web interfaces
      [ServiceType.N8N]: { subdomain: 'n8n', port: 5678, container: 'n8n' },
      [ServiceType.KESTRA]: { subdomain: 'kestra', port: 8080, container: 'kestra' },
      [ServiceType.KEYSTONEJS]: { subdomain: 'keystonejs', port: 3000, container: 'keystonejs' },
      [ServiceType.MINIO]: { subdomain: 'minio', port: 9001, container: 'minio' },
      [ServiceType.OLLAMA]: { subdomain: 'ollama', port: 11434, container: 'ollama' },
      [ServiceType.COCKPIT]: { subdomain: 'cockpit', port: 80, container: 'cockpit' },
      [ServiceType.AUTHELIA]: { subdomain: 'authelia', port: 9091, container: 'authelia' },
      [ServiceType.RABBITMQ]: { subdomain: 'rabbitmq', port: 15672, container: 'rabbitmq' },
      [ServiceType.GRAFANA]: { subdomain: 'grafana', port: 3000, container: 'grafana' },
      [ServiceType.LOKI]: { subdomain: 'loki', port: 3100, container: 'loki' },
      [ServiceType.TRIVY]: { subdomain: 'trivy', port: 8080, container: 'trivy' },
      [ServiceType.SONARQUBE]: { subdomain: 'sonarqube', port: 9000, container: 'sonarqube' },
      [ServiceType.NEXUS]: { subdomain: 'nexus', port: 8081, container: 'nexus' },
      [ServiceType.VAULT]: { subdomain: 'vault', port: 8200, container: 'vault' },
      [ServiceType.RAPIDOC]: { subdomain: 'rapidoc', port: 80, container: 'rapidoc' },
      [ServiceType.PSITRANSFER]: { subdomain: 'psitransfer', port: 3005, container: 'psitransfer' },
      [ServiceType.EXCALIDRAW]: { subdomain: 'excalidraw', port: 80, container: 'excalidraw' },
      [ServiceType.DRAWIO]: { subdomain: 'drawio', port: 8088, container: 'drawio' },
      [ServiceType.KROKI]: { subdomain: 'kroki', port: 8000, container: 'kroki' },
      [ServiceType.OUTLINE]: { subdomain: 'outline', port: 3000, container: 'outline' },
      [ServiceType.GRIST]: { subdomain: 'grist', port: 8484, container: 'grist' },
      [ServiceType.NOCODB]: { subdomain: 'nocodb', port: 8080, container: 'nocodb' },
      [ServiceType.PLANE]: { subdomain: 'plane', port: 3000, container: 'plane-frontend' },
      [ServiceType.JASPERREPORTS]: { subdomain: 'jasper', port: 8080, container: 'jasperreports' },
      [ServiceType.STIRLINGPDF]: { subdomain: 'pdf', port: 8080, container: 'stirlingpdf' },
      [ServiceType.ONEDEV]: { subdomain: 'onedev', port: 6610, container: 'onedev' },
      [ServiceType.REGISTRY]: { subdomain: 'registry', port: 5000, container: 'registry' },
      [ServiceType.LOCALSTACK]: { subdomain: 'localstack', port: 4566, container: 'localstack' },
      [ServiceType.LIBRETRANSLATE]: { subdomain: 'translate', port: 5000, container: 'libretranslate' },
      
      // Services without web interfaces (excluded)
      [ServiceType.POSTGRESQL]: null,
      [ServiceType.REDIS]: null,
      [ServiceType.MONGODB]: null,
      [ServiceType.MARIADB]: null,
      [ServiceType.SCYLLADB]: null,
      [ServiceType.KAFKA]: null,
      [ServiceType.FLUENTBIT]: null,
      [ServiceType.MAILSERVER]: null,
      [ServiceType.FRP]: null
    };

    return this.config.selectedServices
      .map(serviceType => {
        const proxyConfig = serviceProxyMap[serviceType];
        if (proxyConfig) {
          return {
            name: serviceType,
            subdomain: proxyConfig.subdomain,
            port: proxyConfig.port,
            container: proxyConfig.container
          };
        }
        return null;
      })
      .filter(config => config !== null) as Array<{name: string, subdomain: string, port: number, container: string}>;
  }

  /**
   * Override getAccessUrl to return main domain
   */
  getAccessUrl(): string {
    return `https://${this.config.domain}`;
  }
}