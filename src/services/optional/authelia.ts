import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

/**
 * Authelia - Authentication and authorization server
 */
export class AutheliaService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Authelia',
      ServiceType.AUTHELIA,
      false,
      [ServiceType.REDIS],
      config,
      templateEngine
    );
  }

  protected async generateConfigFiles(): Promise<void> {
    try {
      const { writeFile, mkdir } = await import('fs/promises');
      const { join } = await import('path');
      const homeDir = process.env.HOME || process.env.USERPROFILE || '~';
      const configDir = join(homeDir, 'wsdata', 'authelia', 'config');
      
      await mkdir(configDir, { recursive: true });
      
      // Minimal Authelia configuration
      const config = `---
server:
  address: 'tcp://0.0.0.0:9091'

authentication_backend:
  file:
    path: /config/users_database.yml

access_control:
  default_policy: one_factor

session:
  cookies:
    - domain: '${this.config.domain}'
      authelia_url: 'https://authelia.${this.config.domain}'

storage:
  local:
    path: /data/db.sqlite3

notifier:
  filesystem:
    filename: /data/notification.txt
`;
      
      const configPath = join(configDir, 'configuration.yml');
      await writeFile(configPath, config);
      
      // Create users database file
      const usersDb = `---
users:
  admin:
    disabled: false
    displayname: "Admin User"
    password: "$argon2id$v=19$m=65536,t=3,p=4$BpLnfgDsc2WD8F2q$o/vzA4myCqZZ36bUGsDY//8mKUYNZZaR0t4MFFSs+iM"
    email: admin@${this.config.domain}
    groups:
      - admins
      - dev
`;
      
      const usersPath = join(configDir, 'users_database.yml');
      await writeFile(usersPath, usersDb);
      
      console.log(`Generated Authelia configuration at ${configPath}`);
      console.log('Default credentials: admin / password (change after first login)');
    } catch (error) {
      throw new Error(`Failed to generate Authelia configuration: ${error}`);
    }
  }

  getAccessUrl(): string {
    return `https://authelia.${this.config.domain}`;
  }
}
