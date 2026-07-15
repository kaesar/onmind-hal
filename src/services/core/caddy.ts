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
      const configDir = join(homeDir, this.config.configPath);
      
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
    const hasCloudflared = this.config.selectedServices.includes(ServiceType.CLOUDFLARED);

    const services = this.getServiceProxyConfig();

    let content = '# Caddyfile for HomeLab services\n';
    content += '# http:// = HTTP only (port 80), no redirect\n';
    content += '# https:// = HTTPS only (port 443)\n\n';

    // Global options - only for non-local public domains (Let's Encrypt)
    if (!isLocalDomain) {
      content += '{\n';
      content += `    email admin@${this.config.domain}\n`;
      content += '}\n\n';
    }

    // === HTTP on port 80 ===
    content += '# HTTP - port 80 (no redirect)\n';

    // Local domain HTTP
    content += `http://${this.config.domain} {\n`;
    content += `    respond "Welcome to OnMind-HAL" 200\n`;
    content += '}\n\n';

    for (const service of services) {
      content += `http://${service.subdomain}.${this.config.domain} {\n`;
      content += `    reverse_proxy ${service.container}:${service.port}\n`;
      content += '}\n\n';
    }

    // Public domain HTTP routes (for Cloudflare Tunnel)
    if (hasCloudflared && isLocalDomain && this.config.tunnelDomain) {
      content += '# Public domain via Cloudflare Tunnel\n';
      content += `http://${this.config.tunnelDomain} {\n`;
      content += `    respond "Welcome to OnMind-HAL" 200\n`;
      content += '}\n\n';

      for (const service of services) {
        content += `http://${service.subdomain}.${this.config.tunnelDomain} {\n`;
        content += `    reverse_proxy ${service.container}:${service.port} {\n`;
        content += '        header_up X-Forwarded-Proto https\n';
        content += '    }\n';
        content += '}\n\n';
      }
    }

    // === HTTPS on port 443 ===
    content += `# HTTPS - port 443 (${isLocalDomain ? 'self-signed' : "Let's Encrypt"})\n`;

    content += `https://${this.config.domain} {\n`;
    if (isLocalDomain) {
      content += `    tls internal\n`;
    }
    content += `    respond "Welcome to OnMind-HAL" 200\n`;
    content += '}\n\n';

    for (const service of services) {
      content += `https://${service.subdomain}.${this.config.domain} {\n`;
      if (isLocalDomain) {
        content += `    tls internal\n`;
      }
      content += `    reverse_proxy ${service.container}:${service.port}\n`;
      content += '}\n\n';
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
      // Core services (always installed)
      [ServiceType.DOCKHAND]: { subdomain: 'dockhand', port: 3000, container: 'dockhand' },
      [ServiceType.ARCANE]: { subdomain: 'arcane', port: 3552, container: 'arcane' },
      [ServiceType.COPYPARTY]: { subdomain: 'files', port: 3923, container: 'copyparty' },
      
      // Optional services (in README order)
      [ServiceType.DUCKDB]: { subdomain: 'duckdb', port: 80, container: 'duckdb' },
      [ServiceType.POSTGRESQL]: null,
      [ServiceType.REDIS]: null,
      [ServiceType.MONGODB]: null,
      [ServiceType.MARIADB]: null,
      [ServiceType.SCYLLADB]: null,
      [ServiceType.RUSTFS]: { subdomain: 'rustfs', port: 9001, container: 'rustfs' },
      [ServiceType.KAFKA]: null, // No web UI
      [ServiceType.RABBITMQ]: { subdomain: 'rabbitmq', port: 15672, container: 'rabbitmq' },
      [ServiceType.OLLAMA]: { subdomain: 'ollama', port: 11434, container: 'ollama' },
      [ServiceType.OPENWEBUI]: { subdomain: 'openwebui', port: 8080, container: 'openwebui' },
      [ServiceType.OPENNOTEBOOKLM]: { subdomain: 'notebook', port: 8502, container: 'opennotebooklm' },
      [ServiceType.N8N]: { subdomain: 'n8n', port: 5678, container: 'n8n' },
      [ServiceType.KESTRA]: { subdomain: 'kestra', port: 8080, container: 'kestra' },
      [ServiceType.KAFKAUI]: { subdomain: 'kafkaui', port: 8080, container: 'kafkaui' },
      [ServiceType.KEYSTONEJS]: { subdomain: 'keystone', port: 3000, container: 'keystonejs' },
      [ServiceType.KEYCLOAK]: { subdomain: 'keycloak', port: 8080, container: 'keycloak' },
      [ServiceType.AUTHELIA]: { subdomain: 'authelia', port: 9091, container: 'authelia' },
      [ServiceType.TINYAUTH]: { subdomain: 'auth', port: 3011, container: 'tinyauth' },
      [ServiceType.POCKETID]: { subdomain: 'pocketid', port: 8093, container: 'pocketid' },
      [ServiceType.APISIX]: { subdomain: 'apisix', port: 9000, container: 'apisix-dashboard' },
      [ServiceType.FLOCI]: { subdomain: 'floci', port: 4566, container: 'floci' },
      [ServiceType.K3D]: { subdomain: 'k3d', port: 6444, container: 'k3d' },
      [ServiceType.FORGEJO]: { subdomain: 'forgejo', port: 3000, container: 'forgejo' },
      [ServiceType.ONEDEV]: { subdomain: 'onedev', port: 6610, container: 'onedev' },
      [ServiceType.JENKINS]: { subdomain: 'jenkins', port: 8100, container: 'jenkins' },
      [ServiceType.SEMAPHORE]: { subdomain: 'semaphore', port: 3000, container: 'semaphore' },
      [ServiceType.BACKSTAGE]: { subdomain: 'backstage', port: 7007, container: 'backstage' },
      [ServiceType.LIQUIBASE]: { subdomain: 'liquibase', port: 8091, container: 'liquibase' },
      [ServiceType.SONARQUBE]: { subdomain: 'sonarqube', port: 9000, container: 'sonarqube' },
      [ServiceType.TRIVY]: { subdomain: 'trivy', port: 8080, container: 'trivy' },
      [ServiceType.KARATE]: null, // VNC-based (port 5901), no HTTP UI
      [ServiceType.RAPIDOC]: { subdomain: 'rapidoc', port: 80, container: 'rapidoc' },
      [ServiceType.HOPPSCOTCH]: { subdomain: 'hoppscotch', port: 3000, container: 'hoppscotch' },
      [ServiceType.GRAFANA]: { subdomain: 'grafana', port: 3000, container: 'grafana' },
      [ServiceType.LOKI]: { subdomain: 'loki', port: 3100, container: 'loki' },
      [ServiceType.PROMETHEUS]: { subdomain: 'prometheus', port: 9090, container: 'prometheus' },
      [ServiceType.FLUENTBIT]: null, // No web UI
      [ServiceType.OPENSEARCH]: { subdomain: 'opensearch', port: 5601, container: 'opensearch-dashboards' },
      [ServiceType.QDRANT]: { subdomain: 'qdrant', port: 6333, container: 'qdrant' },
      [ServiceType.REDASH]: { subdomain: 'redash', port: 5000, container: 'redash-server' },
      [ServiceType.UPTIMEKUMA]: { subdomain: 'uptimekuma', port: 3001, container: 'uptimekuma' },
      [ServiceType.DOZZLE]: { subdomain: 'dozzle', port: 8080, container: 'dozzle' },
      [ServiceType.REGISTRY]: { subdomain: 'registry', port: 5000, container: 'registry' },
      [ServiceType.NEXUS]: { subdomain: 'nexus', port: 8081, container: 'nexus' },
      [ServiceType.INFISCAL]: { subdomain: 'secrets', port: 8080, container: 'infisical' },
      [ServiceType.VAULT]: { subdomain: 'vault', port: 8200, container: 'vault' },
      [ServiceType.VAULTWARDEN]: { subdomain: 'vaultwarden', port: 80, container: 'vaultwarden' },
      [ServiceType.LINKWARDEN]: { subdomain: 'linkwarden', port: 3000, container: 'linkwarden' },
      [ServiceType.SHLINK]: { subdomain: 'shlink', port: 8080, container: 'shlink' },
      [ServiceType.SEND]: { subdomain: 'send', port: 1443, container: 'send' },
      [ServiceType.FILESTASH]: { subdomain: 'filestash', port: 8334, container: 'filestash' },
      [ServiceType.SEAFILE]: { subdomain: 'drive', port: 8082, container: 'seafile' },
      [ServiceType.EXCALIDRAW]: { subdomain: 'excalidraw', port: 80, container: 'excalidraw' },
      [ServiceType.DRAWIO]: { subdomain: 'drawio', port: 8080, container: 'drawio' },
      [ServiceType.KROKI]: { subdomain: 'kroki', port: 8000, container: 'kroki' },
      [ServiceType.PRESENTON]: { subdomain: 'presenton', port: 80, container: 'presenton' },
      [ServiceType.SLIDEV]: { subdomain: 'slidev', port: 3030, container: 'slidev' },
      [ServiceType.OUTLINE]: { subdomain: 'outline', port: 3000, container: 'outline' },
      [ServiceType.GRIST]: { subdomain: 'grist', port: 8484, container: 'grist' },
      [ServiceType.NOCODB]: { subdomain: 'nocodb', port: 8080, container: 'nocodb' },
      [ServiceType.DIRECTUS]: { subdomain: 'directus', port: 8055, container: 'directus' },
      [ServiceType.INSFORGE]: { subdomain: 'insforge', port: 7130, container: 'insforge' },
      [ServiceType.SPARK]: { subdomain: 'spark', port: 8080, container: 'spark' },
      [ServiceType.TWENTYCRM]: { subdomain: 'crm', port: 3000, container: 'twentycrm' },
      [ServiceType.CHATWOOT]: { subdomain: 'chatwoot', port: 3000, container: 'chatwoot' },
      [ServiceType.MEDUSAJS]: { subdomain: 'shop', port: 9000, container: 'medusajs' },
      [ServiceType.HULY]: { subdomain: 'huly', port: 80, container: 'huly' },
      [ServiceType.MATTERMOST]: { subdomain: 'mattermost', port: 8065, container: 'mattermost' },
      [ServiceType.CALCOM]: { subdomain: 'cal', port: 3000, container: 'calcom' },
      [ServiceType.ADGUARD]: { subdomain: 'adguard', port: 3000, container: 'adguard' },
      [ServiceType.JASPERREPORTS]: { subdomain: 'jasper', port: 8080, container: 'jasperreports' },
      [ServiceType.DOCUSEAL]: { subdomain: 'docuseal', port: 3000, container: 'docuseal' },
      [ServiceType.STIRLINGPDF]: { subdomain: 'pdf', port: 8080, container: 'stirlingpdf' },
      [ServiceType.PANDOCWEB]: { subdomain: 'pandoc', port: 8080, container: 'pandocweb' },
      [ServiceType.CALIBREWEB]: { subdomain: 'books', port: 8083, container: 'calibreweb' },
      [ServiceType.IMMICH]: { subdomain: 'photos', port: 2283, container: 'immich-server' },
      [ServiceType.LIBRETRANSLATE]: { subdomain: 'translate', port: 5000, container: 'libretranslate' },
      [ServiceType.LITELLM]: { subdomain: 'litellm', port: 4000, container: 'litellm' },
      [ServiceType.ANYTHINGLLM]: { subdomain: 'anythingllm', port: 3001, container: 'anythingllm' },
      [ServiceType.LIGHTRAG]: { subdomain: 'lightrag', port: 9621, container: 'lightrag' },
      [ServiceType.VOICEBOX]: { subdomain: 'voicebox', port: 17493, container: 'voicebox' },
      [ServiceType.COPILOTKIT]: { subdomain: 'copilotkit', port: 4201, container: 'copilotkit' },
      [ServiceType.GOOSE]: { subdomain: 'goose', port: 8300, container: 'goose' },
      [ServiceType.OPENCLAW]: { subdomain: 'openclaw', port: 18789, container: 'openclaw' },
      [ServiceType.FIRECRAWL]: { subdomain: 'firecrawl', port: 3002, container: 'firecrawl' },
      [ServiceType.SEARXNG]: { subdomain: 'searxng', port: 8080, container: 'searxng' },
      [ServiceType.PLAUSIBLE]: { subdomain: 'analytics', port: 8000, container: 'plausible' },
      [ServiceType.NTFY]: { subdomain: 'ntfy', port: 80, container: 'ntfy' },
      [ServiceType.MAILPIT]: { subdomain: 'mailpit', port: 8025, container: 'mailpit' },
      [ServiceType.MAILSERVER]: null,
      [ServiceType.LISTMONK]: { subdomain: 'listmonk', port: 9000, container: 'listmonk' },
      [ServiceType.HEADSCALE]: { subdomain: 'headscale', port: 8019, container: 'headscale' },
      [ServiceType.CLOUDFLARED]: null, // No web UI - managed via Cloudflare Dashboard
      [ServiceType.WETTY]: { subdomain: 'wetty', port: 3000, container: 'wetty' },
      [ServiceType.RUSTDESK]: { subdomain: 'rustdesk', port: 21115, container: 'rustdesk-hbbs' },
      [ServiceType.CODESERVER]: { subdomain: 'codeserver', port: 8080, container: 'codeserver' },
      [ServiceType.CONSUL]: { subdomain: 'consul', port: 8500, container: 'consul' },
      [ServiceType.COROOT]: { subdomain: 'coroot', port: 8080, container: 'coroot' },
      [ServiceType.FLOCIAZ]: { subdomain: 'flociaz', port: 4566, container: 'flociaz' },
      [ServiceType.FLOCIGCP]: { subdomain: 'flocigcp', port: 4566, container: 'flocigcp' },
      [ServiceType.HERMES]: { subdomain: 'hermes', port: 8642, container: 'hermes' },
      [ServiceType.JUPYTERLAB]: { subdomain: 'jupyterlab', port: 8888, container: 'jupyterlab' },
      [ServiceType.K6]: { subdomain: 'k6', port: 6565, container: 'k6' },
      [ServiceType.PSITRANSFER]: { subdomain: 'psitransfer', port: 3000, container: 'psitransfer' },
      [ServiceType.TOOLJET]: { subdomain: 'tooljet', port: 3000, container: 'tooljet' },
      [ServiceType.WISEMAPPING]: { subdomain: 'wisemapping', port: 8080, container: 'wisemapping' },
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

  /**
   * Regenerate Caddyfile (used after Cloudflare Tunnel config sets tunnelDomain)
   */
  async regenerateConfigFiles(): Promise<void> {
    await this.generateConfigFiles();
  }
}