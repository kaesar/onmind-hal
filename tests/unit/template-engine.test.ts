import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { TemplateEngine } from '../../src/templates/engine.js';
import { TemplateError } from '../../src/utils/errors.js';

describe('TemplateEngine', () => {
  const testTemplateDir = 'test-templates';
  let engine: TemplateEngine;

  beforeEach(async () => {
    // Create test template directory
    await mkdir(testTemplateDir, { recursive: true });
    engine = new TemplateEngine(testTemplateDir);
  });

  afterEach(async () => {
    // Clean up test directory
    await rm(testTemplateDir, { recursive: true, force: true });
  });

  describe('load', () => {
    it('should load a valid template from JSON file', async () => {
      const templateData = {
        content: 'Hello {{name}}!',
        variables: { name: 'string' }
      };
      
      await writeFile(
        join(testTemplateDir, 'greeting.json'),
        JSON.stringify(templateData)
      );

      const template = await engine.load('greeting');
      
      expect(template.name).toBe('greeting');
      expect(template.content).toBe(JSON.stringify(templateData.content));
      expect(template.variables).toEqual(templateData.variables);
    });

    it('should load template without explicit content property', async () => {
      const templateData = {
        message: 'Welcome {{user}}!',
        type: 'greeting'
      };
      
      await writeFile(
        join(testTemplateDir, 'simple.json'),
        JSON.stringify(templateData)
      );

      const template = await engine.load('simple');
      
      expect(template.name).toBe('simple');
      expect(template.content).toBe(JSON.stringify(templateData));
    });

    it('should cache loaded templates', async () => {
      const templateData = { content: 'Cached {{value}}' };
      
      await writeFile(
        join(testTemplateDir, 'cached.json'),
        JSON.stringify(templateData)
      );

      const template1 = await engine.load('cached');
      const template2 = await engine.load('cached');
      
      expect(template1).toBe(template2); // Same object reference
      expect(engine.getCachedTemplates()).toContain('cached');
    });

    it('should throw TemplateError for non-existent template', async () => {
      await expect(engine.load('nonexistent')).rejects.toThrow(TemplateError);
      await expect(engine.load('nonexistent')).rejects.toThrow('Template file not found');
    });

    it('should throw TemplateError for invalid JSON', async () => {
      await writeFile(
        join(testTemplateDir, 'invalid.json'),
        '{ invalid json }'
      );

      await expect(engine.load('invalid')).rejects.toThrow(TemplateError);
      await expect(engine.load('invalid')).rejects.toThrow('Invalid format');
    });
  });

  describe('validate', () => {
    it('should validate valid template structure', () => {
      const validTemplate = {
        content: 'Hello {{name}}',
        variables: { name: 'string' }
      };

      expect(() => engine.validate('test', validTemplate)).not.toThrow();
    });

    it('should throw error for null template', () => {
      expect(() => engine.validate('test', null)).toThrow(TemplateError);
      expect(() => engine.validate('test', null)).toThrow('Template must be a valid JSON object');
    });

    it('should throw error for non-object template', () => {
      expect(() => engine.validate('test', 'string')).toThrow(TemplateError);
      expect(() => engine.validate('test', 123)).toThrow(TemplateError);
    });

    it('should throw error for invalid content type', () => {
      const invalidTemplate = {
        content: 123,
        variables: {}
      };

      expect(() => engine.validate('test', invalidTemplate)).toThrow(TemplateError);
      expect(() => engine.validate('test', invalidTemplate)).toThrow('Template content must be a string or object');
    });

    it('should throw error for invalid variables type', () => {
      const invalidTemplate = {
        content: 'Hello {{name}}',
        variables: 'invalid'
      };

      expect(() => engine.validate('test', invalidTemplate)).toThrow(TemplateError);
      expect(() => engine.validate('test', invalidTemplate)).toThrow('Template variables must be an object');
    });
  });

  describe('render', () => {
    it('should render template with variable interpolation', () => {
      const template = {
        name: 'test',
        content: 'Hello {{name}}, welcome to {{place}}!',
        variables: {},
        render: (context: Record<string, any>) => engine.render(template, context)
      };

      const context = { name: 'John', place: 'HomeLab' };
      const result = engine.render(template, context);
      
      expect(result).toBe('Hello John, welcome to HomeLab!');
    });

    it('should handle multiple occurrences of same variable', () => {
      const template = {
        name: 'test',
        content: '{{greeting}} {{name}}, {{greeting}} again!',
        variables: {},
        render: (context: Record<string, any>) => engine.render(template, context)
      };

      const context = { greeting: 'Hello', name: 'Alice' };
      const result = engine.render(template, context);
      
      expect(result).toBe('Hello Alice, Hello again!');
    });

    it('should convert non-string values to strings', () => {
      const template = {
        name: 'test',
        content: 'Port: {{port}}, Enabled: {{enabled}}',
        variables: {},
        render: (context: Record<string, any>) => engine.render(template, context)
      };

      const context = { port: 8080, enabled: true };
      const result = engine.render(template, context);
      
      expect(result).toBe('Port: 8080, Enabled: true');
    });

    it('should throw error for missing required variables', () => {
      const template = {
        name: 'test',
        content: 'Hello {{name}}!',
        variables: {},
        render: (context: Record<string, any>) => engine.render(template, context)
      };

      const context = {}; // Missing 'name' variable
      
      expect(() => engine.render(template, context)).toThrow(TemplateError);
      expect(() => engine.render(template, context)).toThrow('Missing required variable: name');
    });

    it('should throw error for null or undefined variables', () => {
      const template = {
        name: 'test',
        content: 'Value: {{value}}',
        variables: {},
        render: (context: Record<string, any>) => engine.render(template, context)
      };

      expect(() => engine.render(template, { value: null })).toThrow(TemplateError);
      expect(() => engine.render(template, { value: undefined })).toThrow(TemplateError);
    });

    it('should handle templates without variables', () => {
      const template = {
        name: 'test',
        content: 'Static content without variables',
        variables: {},
        render: (context: Record<string, any>) => engine.render(template, context)
      };

      const result = engine.render(template, {});
      
      expect(result).toBe('Static content without variables');
    });
  });

  describe('cache management', () => {
    it('should clear template cache', async () => {
      const templateData = { content: 'Test {{value}}' };
      
      await writeFile(
        join(testTemplateDir, 'test.json'),
        JSON.stringify(templateData)
      );

      await engine.load('test');
      expect(engine.getCachedTemplates()).toContain('test');
      
      engine.clearCache();
      expect(engine.getCachedTemplates()).toHaveLength(0);
    });

    it('should return list of cached template names', async () => {
      const templates = ['template1', 'template2', 'template3'];
      
      for (const name of templates) {
        await writeFile(
          join(testTemplateDir, `${name}.json`),
          JSON.stringify({ content: `Content for ${name}` })
        );
        await engine.load(name);
      }

      const cachedNames = engine.getCachedTemplates();
      expect(cachedNames).toHaveLength(3);
      expect(cachedNames).toEqual(expect.arrayContaining(templates));
    });
  });
});