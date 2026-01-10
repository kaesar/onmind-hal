import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

/**
 * FRP (Fast Reverse Proxy) - Client service
 * Provides secure tunnel to expose local services through a remote server
 */
export class FrpService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'FRP Client',
      ServiceType.FRP,
      false,
      [],
      config,
      templateEngine
    );
  }

  protected async generateConfigFiles(): Promise<void> {
    try {
      const homeDir = process.env.HOME || process.env.USERPROFILE || '~';
      const configDir = join(homeDir, 'wsconf');
      
      await mkdir(configDir, { recursive: true });
      
      // FRP client configuration
      const frpcConfig = `[common]
server_addr = YOUR_VPS_IP
server_port = 7000
token = YOUR_SECRET_TOKEN

[web-http]
type = http
local_ip = 127.0.0.1
local_port = 80
custom_domains = ${this.config.domain}

[web-https]
type = https
local_ip = 127.0.0.1
local_port = 443
custom_domains = ${this.config.domain}
`;
      
      const configPath = join(configDir, 'frpc.ini');
      await writeFile(configPath, frpcConfig);
      
      console.log(`Generated FRP client configuration at ${configPath}`);
      console.log('⚠️  IMPORTANT: Edit frpc.ini and set your VPS IP and token');
    } catch (error) {
      throw new Error(`Failed to generate FRP configuration: ${error}`);
    }
  }

  getAccessUrl(): string {
    return `https://${this.config.domain} (via FRP tunnel)`;
  }
}
