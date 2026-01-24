import { ServiceType, HomelabConfig } from '../../core/types.js';
import { ServiceInstallationError } from '../../utils/errors.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class CloudflaredService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Cloudflare Tunnel',
      ServiceType.CLOUDFLARED,
      false,
      [],
      config,
      templateEngine
    );
  }

  async install(): Promise<void> {
    await super.install();
    
    console.log('\n⚠️  MANUAL SETUP REQUIRED FOR CLOUDFLARE TUNNEL:');
    console.log('1. Authenticate with Cloudflare:');
    console.log('   docker run -v ~/.cloudflared:/home/nonroot/.cloudflared cloudflare/cloudflared:latest tunnel login');
    console.log('\n2. Create a tunnel:');
    console.log('   docker run -v ~/.cloudflared:/home/nonroot/.cloudflared cloudflare/cloudflared:latest tunnel create homelab');
    console.log('\n3. Configure your tunnel in ~/.cloudflared/config.yml');
    console.log('   Example: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/');
    console.log('\n4. Start the tunnel:');
    console.log('   docker start cloudflared');
    console.log('\n📖 See HELP.md for detailed configuration instructions\n');
  }

  getAccessUrl(): string {
    return 'https://dash.cloudflare.com (Cloudflare Dashboard)';
  }
}
