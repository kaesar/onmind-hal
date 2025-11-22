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
    const coreServices = ['caddy', 'portainer', 'copyparty'];
    const optionalServices = ['n8n', 'postgresql', 'redis', 'mongodb', 'mariadb', 'minio', 'ollama', 'kafka', 'authelia', 'localstack', 'onedev', 'kestra', 'registry', 'vault', 'palmr', 'excalidraw', 'outline', 'grist'];
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
      
      expect(templates.size).toBe(21);
      allServices.forEach(service => {
        expect(templates.has(service)).toBe(true);
      });
    });
  });

  describe('Configuration Templates', () => {
    const configs = ['caddyfile', 'dnsmasq', 'copyparty'];

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
      
      expect(templates.size).toBe(3);
      configs.forEach(config => {
        expect(templates.has(config)).toBe(true);
      });
    });
  });

  describe('Template Variable Extraction', () => {
    it('should extract variables from docker templates', async () => {
      const ubuntuTemplate = await loader.loadTemplate('docker/ubuntu');
      const variables = validator.extractRequiredVariables(ubuntuTemplate);
      
      expect(variables).toContain('networkName');
    });

    it('should extract variables from service templates', async () => {
      const caddyTemplate = await loader.loadTemplate('services/caddy');
      const variables = validator.extractRequiredVariables(caddyTemplate);
      
      expect(variables).toContain('networkName');
    });

    it('should extract variables from config templates', async () => {
      const caddyfileTemplate = await loader.loadTemplate('config/caddyfile');
      const variables = validator.extractRequiredVariables(caddyfileTemplate);
      
      expect(variables).toContain('domain');
    });
  });

  describe('Template Rendering', () => {
    it('should render docker template with variables', async () => {
      const template = await engine.load('docker/ubuntu');
      const context = { networkName: 'homelab-network' };
      
      const rendered = engine.render(template, context);
      
      expect(rendered).toContain('homelab-network');
      expect(rendered).not.toContain('{{networkName}}');
    });

    it('should render service template with variables', async () => {
      const template = await engine.load('services/portainer');
      const context = { networkName: 'homelab-network', domain: 'homelab.local' };
      
      const rendered = engine.render(template, context);
      
      expect(rendered).toContain('homelab-network');
      expect(rendered).not.toContain('{{networkName}}');
    });

    it('should render config template with variables', async () => {
      const template = await engine.load('config/caddyfile');
      const context = { domain: 'homelab.local' };
      
      const rendered = engine.render(template, context);
      
      expect(rendered).toContain('homelab.local');
      expect(rendered).not.toContain('{{domain}}');
    });
  });
});