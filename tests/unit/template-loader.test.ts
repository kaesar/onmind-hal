import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { TemplateLoader } from '../../src/templates/loader.js';
import { TemplateError } from '../../src/utils/errors.js';

describe('TemplateLoader', () => {
  const testTemplateDir = 'test-templates-loader';
  let loader: TemplateLoader;

  beforeEach(async () => {
    // Create test template directory
    await mkdir(testTemplateDir, { recursive: true });
    loader = new TemplateLoader(testTemplateDir);
  });

  afterEach(async () => {
    // Clean up test directory
    await rm(testTemplateDir, { recursive: true, force: true });
  });

  describe('loadTemplate', () => {
    it('should load a valid JSON template', async () => {
      const templateData = {
        name: 'test-service',
        image: 'nginx:latest',
        ports: ['80:80']
      };
      
      await writeFile(
        join(testTemplateDir, 'nginx.json'),
        JSON.stringify(templateData)
      );

      const result = await loader.loadTemplate('nginx');
      expect(result).toEqual(templateData);
    });

    it('should throw TemplateError for non-existent template', async () => {
      await expect(loader.loadTemplate('nonexistent')).rejects.toThrow(TemplateError);
      await expect(loader.loadTemplate('nonexistent')).rejects.toThrow('Template file not found');
    });

    it('should throw TemplateError for invalid JSON', async () => {
      await writeFile(
        join(testTemplateDir, 'invalid.json'),
        '{ "name": "test", invalid }'
      );

      await expect(loader.loadTemplate('invalid')).rejects.toThrow(TemplateError);
      await expect(loader.loadTemplate('invalid')).rejects.toThrow('Invalid JSON format');
    });

    it('should load template from subdirectory', async () => {
      const subDir = join(testTemplateDir, 'services');
      await mkdir(subDir, { recursive: true });
      
      const templateData = { service: 'caddy' };
      await writeFile(
        join(subDir, 'caddy.json'),
        JSON.stringify(templateData)
      );

      const result = await loader.loadTemplate('services/caddy');
      expect(result).toEqual(templateData);
    });
  });

  describe('loadAllTemplates', () => {
    it('should load all JSON templates from directory', async () => {
      const templates = {
        'template1': { name: 'Template 1' },
        'template2': { name: 'Template 2' },
        'template3': { name: 'Template 3' }
      };

      for (const [name, data] of Object.entries(templates)) {
        await writeFile(
          join(testTemplateDir, `${name}.json`),
          JSON.stringify(data)
        );
      }

      // Add a non-JSON file that should be ignored
      await writeFile(join(testTemplateDir, 'readme.txt'), 'This is not a template');

      const result = await loader.loadAllTemplates();
      
      expect(result.size).toBe(3);
      expect(result.get('template1')).toEqual(templates.template1);
      expect(result.get('template2')).toEqual(templates.template2);
      expect(result.get('template3')).toEqual(templates.template3);
    });

    it('should load templates from subdirectory', async () => {
      const subDir = join(testTemplateDir, 'docker');
      await mkdir(subDir, { recursive: true });
      
      const templateData = { distribution: 'ubuntu' };
      await writeFile(
        join(subDir, 'ubuntu.json'),
        JSON.stringify(templateData)
      );

      const result = await loader.loadAllTemplates('docker');
      
      expect(result.size).toBe(1);
      expect(result.get('ubuntu')).toEqual(templateData);
    });

    it('should handle directory with invalid templates gracefully', async () => {
      // Create valid template
      await writeFile(
        join(testTemplateDir, 'valid.json'),
        JSON.stringify({ name: 'valid' })
      );

      // Create invalid template
      await writeFile(
        join(testTemplateDir, 'invalid.json'),
        '{ invalid json }'
      );

      const result = await loader.loadAllTemplates();
      
      // Should load only the valid template
      expect(result.size).toBe(1);
      expect(result.get('valid')).toEqual({ name: 'valid' });
    });

    it('should throw error for non-existent directory', async () => {
      await expect(loader.loadAllTemplates('nonexistent')).rejects.toThrow(TemplateError);
      await expect(loader.loadAllTemplates('nonexistent')).rejects.toThrow('Template directory not found');
    });
  });

  describe('templateExists', () => {
    it('should return true for existing template', async () => {
      await writeFile(
        join(testTemplateDir, 'exists.json'),
        JSON.stringify({ name: 'exists' })
      );

      const exists = await loader.templateExists('exists');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent template', async () => {
      const exists = await loader.templateExists('nonexistent');
      expect(exists).toBe(false);
    });

    it('should return false for directory with same name', async () => {
      await mkdir(join(testTemplateDir, 'directory.json'), { recursive: true });

      const exists = await loader.templateExists('directory');
      expect(exists).toBe(false);
    });
  });

  describe('listTemplates', () => {
    it('should list all JSON template names', async () => {
      const templateNames = ['template1', 'template2', 'template3'];
      
      for (const name of templateNames) {
        await writeFile(
          join(testTemplateDir, `${name}.json`),
          JSON.stringify({ name })
        );
      }

      // Add non-JSON file
      await writeFile(join(testTemplateDir, 'readme.txt'), 'Not a template');

      const result = await loader.listTemplates();
      
      expect(result).toHaveLength(3);
      expect(result).toEqual(expect.arrayContaining(templateNames));
      expect(result).not.toContain('readme');
    });

    it('should list templates from subdirectory', async () => {
      const subDir = join(testTemplateDir, 'services');
      await mkdir(subDir, { recursive: true });
      
      await writeFile(
        join(subDir, 'caddy.json'),
        JSON.stringify({ service: 'caddy' })
      );
      
      await writeFile(
        join(subDir, 'portainer.json'),
        JSON.stringify({ service: 'portainer' })
      );

      const result = await loader.listTemplates('services');
      
      expect(result).toHaveLength(2);
      expect(result).toEqual(expect.arrayContaining(['caddy', 'portainer']));
    });

    it('should return empty array for non-existent directory', async () => {
      const result = await loader.listTemplates('nonexistent');
      expect(result).toEqual([]);
    });

    it('should return empty array for empty directory', async () => {
      const emptyDir = join(testTemplateDir, 'empty');
      await mkdir(emptyDir, { recursive: true });

      const result = await loader.listTemplates('empty');
      expect(result).toEqual([]);
    });
  });

  describe('getTemplatePath', () => {
    it('should return correct template path', () => {
      const path = loader.getTemplatePath('test-template');
      expect(path).toBe(join(testTemplateDir, 'test-template.json'));
    });

    it('should handle template names with subdirectories', () => {
      const path = loader.getTemplatePath('services/caddy');
      expect(path).toBe(join(testTemplateDir, 'services/caddy.json'));
    });
  });
});