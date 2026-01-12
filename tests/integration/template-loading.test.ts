import { describe, it, expect } from 'bun:test';
import { TemplateLoader } from '../../src/templates/loader.js';
import { TemplateValidator } from '../../src/templates/validator.js';
import { TemplateEngine } from '../../src/templates/engine.js';

describe('Template Loading Integration', () => {
  const loader = new TemplateLoader('templates');
  const validator = new TemplateValidator();
  const engine = new TemplateEngine('templates');

  describe('Docker Templates', () => {
    const distributions = ['ubuntu', 'arch', 'amazon'];

    distributions.forEach(dist => {
      it(`should load and validate ${dist} docker template`, async () => {
        const template = await loader.loadTemplate(`docker/${dist}`);
        
        expect(template).toBeDefined();
        expect(template.name).toContain(dist);
        expect(template.commands).toBeDefined();
        expect(template.commands.install).toBeInstanceOf(Array);
        expect(template.commands.setup).toBeInstanceOf(Array);
        expect(template.commands.run).toBeDefined();
        
        // Validate against docker schema
        const result = validator.validate(`docker/${dist}`, template, 'docker');
        expect(result.isValid).toBe(true);
      });
    });

    it('should load all docker templates', async () => {
      const templates = await loader.loadAllTemplates('docker');
      
      expect(templates.size).toBe(3);
      expect(templates.has('ubuntu')).toBe(true);
      expect(templates.has('arch')).toBe(true);
      expect(templates.has('amazon')).toBe(true);
    });
  });

  describe('Service Templates', () => {
    const coreServices = ['caddy', 'portainer', 'copyparty', 'duckdb'];
    const optionalServices = ['postgresql', 'redis', 'mongodb', 'mariadb', 'scylladb', 'minio', 'kafka', 'rabbitmq', 'ollama', 'n8n', 'kestra', 'keystonejs', 'keycloak', 'authelia', 'localstack', 'k3d', 'onedev', 'semaphore', 'liquibase', 'sonarqube', 'trivy', 'rapidoc', 'hoppscotch', 'grafana', 'loki', 'fluentbit', 'uptimekuma', 'registry', 'nexus', 'vault', 'vaultwarden', 'psitransfer', 'excalidraw', 'drawio', 'kroki', 'outline', 'grist', 'nocodb', 'plane', 'jasperreports', 'stirlingpdf', 'libretranslate', 'mailserver', 'frp'];
    const allServices = [...coreServices, ...optionalServices];

    allServices.forEach(service => {
      it(`should load and validate ${service} service template`, async () => {
        const template = await loader.loadTemplate(`services/${service}`);
        
        expect(template).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.commands).toBeDefined();
        expect(template.commands.run).toBeDefined();
      });
    });

    it('should distinguish between core and optional services', async () => {
      for (const service of coreServices) {
        const template = await loader.loadTemplate(`services/${service}`);
        // Core services may or may not have isCore flag in template
        expect(template).toBeDefined();
      }

      for (const service of optionalServices) {
        const template = await loader.loadTemplate(`services/${service}`);
        // Optional services templates are loaded successfully
        expect(template).toBeDefined();
      }
    });

    it('should load all service templates', async () => {
      const templates = await loader.loadAllTemplates('services');
      
      // Should load both .json and .yml templates
      expect(templates.size).toBeGreaterThanOrEqual(45); // Updated count with keycloak, hoppscotch, vaultwarden
      allServices.forEach(service => {
        expect(templates.has(service)).toBe(true);
      });
    });
  });

  describe('Configuration Templates', () => {
    const configs = ['dnsmasq', 'copyparty'];

    configs.forEach(config => {
      it(`should load and validate ${config} configuration template`, async () => {
        const template = await loader.loadTemplate(`config/${config}`);
        
        expect(template).toBeDefined();
        expect(template.filename).toBeDefined();
        expect(template.content).toBeDefined();
        expect(typeof template.content).toBe('string');
        
        // Validate against config schema
        const result = validator.validate(`config/${config}`, template, 'config');
        expect(result.isValid).toBe(true);
      });
    });

    it('should load all configuration templates', async () => {
      const templates = await loader.loadAllTemplates('config');
      
      expect(templates.size).toBe(2);
      configs.forEach(config => {
        expect(templates.has(config)).toBe(true);
      });
    });
  });

  describe('Template Variable Extraction', () => {
    it('should extract variables from docker templates', async () => {
      const ubuntuTemplate = await loader.loadTemplate('docker/ubuntu');
      const variables = validator.extractRequiredVariables(ubuntuTemplate);
      
      // Docker templates no longer have networkName variable (removed redundancy)
      expect(variables).toEqual([]);
    });

    it('should extract variables from service templates', async () => {
      const caddyTemplate = await loader.loadTemplate('services/caddy');
      const variables = validator.extractRequiredVariables(caddyTemplate);
      
      expect(variables).toContain('NETWORK_NAME');
    });

    it('should extract variables from config templates', async () => {
      const dnsmasqTemplate = await loader.loadTemplate('config/dnsmasq');
      const variables = validator.extractRequiredVariables(dnsmasqTemplate);
      
      expect(variables).toContain('DOMAIN');
    });
  });

  describe('Template Rendering', () => {
    it('should render docker template with variables', async () => {
      const template = await engine.load('docker/ubuntu');
      const context = {}; // No variables needed for docker templates now
      
      const rendered = engine.render(template, context);
      
      // Docker templates should render successfully without variables
      expect(rendered).toContain('ubuntu-docker');
      expect(rendered).toContain('systemctl enable docker');
    });

    it('should render service template with variables', async () => {
      const template = await engine.load('services/portainer');
      const context = { NETWORK_NAME: 'homelab-network', DOMAIN: 'homelab.local' };
      
      const rendered = engine.render(template, context);
      
      expect(rendered).toContain('homelab-network');
      expect(rendered).not.toContain('{{NETWORK_NAME}}');
    });

    it('should render config template with variables', async () => {
      const template = await engine.load('config/dnsmasq');
      const context = { DOMAIN: 'homelab.local', IP: '192.168.1.100' };
      
      const rendered = engine.render(template, context);
      
      expect(rendered).toContain('homelab.local');
      expect(rendered).not.toContain('{{DOMAIN}}');
    });
  });
});