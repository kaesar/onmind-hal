import { describe, it, expect, beforeEach } from 'bun:test';
import { TemplateValidator, ValidationResult, TemplateSchema } from '../../src/templates/validator.js';
import { TemplateError } from '../../src/utils/errors.js';

describe('TemplateValidator', () => {
  let validator: TemplateValidator;

  beforeEach(() => {
    validator = new TemplateValidator();
  });

  describe('validate', () => {
    it('should validate basic template structure', () => {
      const templateData = {
        content: 'Hello {{name}}!',
        variables: { name: 'string' }
      };

      const result = validator.validate('test', templateData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject null template', () => {
      const result = validator.validate('test', null);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Template must be a valid JSON object');
    });

    it('should reject non-object template', () => {
      const result = validator.validate('test', 'string template');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Template must be a valid JSON object');
    });

    it('should validate against docker schema', () => {
      const dockerTemplate = {
        commands: {
          install: ['apt update', 'apt install -y docker.io'],
          setup: ['systemctl enable docker'],
          run: 'docker run -d nginx'
        },
        variables: ['image', 'port'],
        dependencies: ['curl']
      };

      const result = validator.validate('docker-test', dockerTemplate, 'docker');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail docker schema validation for missing commands', () => {
      const invalidDockerTemplate = {
        variables: ['image'],
        dependencies: ['curl']
      };

      const result = validator.validate('docker-test', invalidDockerTemplate, 'docker');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: commands');
    });

    it('should validate service schema', () => {
      const serviceTemplate = {
        name: 'nginx',
        image: 'nginx:latest',
        ports: ['80:80', '443:443'],
        environment: {
          NGINX_HOST: '{{domain}}',
          NGINX_PORT: '80'
        }
      };

      const result = validator.validate('service-test', serviceTemplate, 'service');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate config schema', () => {
      const configTemplate = {
        filename: 'nginx.conf',
        content: 'server { listen 80; server_name {{domain}}; }',
        variables: ['domain'],
        permissions: '644'
      };

      const result = validator.validate('config-test', configTemplate, 'config');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about unexpected fields', () => {
      const templateWithExtra = {
        name: 'test',
        image: 'nginx:latest',
        unexpectedField: 'value'
      };

      const result = validator.validate('service-test', templateWithExtra, 'service');
      
      expect(result.warnings).toContain('Unexpected field: unexpectedField');
    });
  });

  describe('validateOrThrow', () => {
    it('should not throw for valid template', () => {
      const validTemplate = {
        content: 'Hello {{name}}!',
        variables: { name: 'string' }
      };

      expect(() => validator.validateOrThrow('test', validTemplate)).not.toThrow();
    });

    it('should throw TemplateError for invalid template', () => {
      const invalidTemplate = null;

      expect(() => validator.validateOrThrow('test', invalidTemplate)).toThrow(TemplateError);
      expect(() => validator.validateOrThrow('test', invalidTemplate)).toThrow('Validation failed');
    });
  });

  describe('registerSchema', () => {
    it('should register and use custom schema', () => {
      const customSchema: TemplateSchema = {
        requiredFields: ['customField'],
        optionalFields: ['optionalField'],
        fieldTypes: {
          customField: 'string',
          optionalField: 'number'
        }
      };

      validator.registerSchema('custom', customSchema);

      const validTemplate = {
        customField: 'value',
        optionalField: 42
      };

      const result = validator.validate('test', validTemplate, 'custom');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation against custom schema', () => {
      const customSchema: TemplateSchema = {
        requiredFields: ['requiredField'],
        optionalFields: [],
        fieldTypes: {
          requiredField: 'string'
        }
      };

      validator.registerSchema('custom', customSchema);

      const invalidTemplate = {
        wrongField: 'value'
      };

      const result = validator.validate('test', invalidTemplate, 'custom');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: requiredField');
    });
  });

  describe('extractRequiredVariables', () => {
    it('should extract variables from string content', () => {
      const template = {
        content: 'Hello {{name}}, welcome to {{place}}!'
      };

      const variables = validator.extractRequiredVariables(template);
      
      expect(variables).toHaveLength(2);
      expect(variables).toEqual(expect.arrayContaining(['name', 'place']));
    });

    it('should extract variables from object content', () => {
      const template = {
        content: {
          message: 'Hello {{name}}!',
          config: {
            host: '{{hostname}}',
            port: '{{port}}'
          },
          list: ['item1', 'item with {{variable}}']
        }
      };

      const variables = validator.extractRequiredVariables(template);
      
      expect(variables).toHaveLength(4);
      expect(variables).toEqual(expect.arrayContaining(['name', 'hostname', 'port', 'variable']));
    });

    it('should extract variables from template without explicit content property', () => {
      const template = {
        message: 'Hello {{user}}!',
        settings: {
          theme: '{{theme}}'
        }
      };

      const variables = validator.extractRequiredVariables(template);
      
      expect(variables).toHaveLength(2);
      expect(variables).toEqual(expect.arrayContaining(['user', 'theme']));
    });

    it('should handle duplicate variables', () => {
      const template = {
        content: '{{greeting}} {{name}}, {{greeting}} again!'
      };

      const variables = validator.extractRequiredVariables(template);
      
      expect(variables).toHaveLength(2);
      expect(variables).toEqual(expect.arrayContaining(['greeting', 'name']));
    });

    it('should return empty array for template without variables', () => {
      const template = {
        content: 'Static content without variables'
      };

      const variables = validator.extractRequiredVariables(template);
      
      expect(variables).toHaveLength(0);
    });
  });

  describe('validateVariableAvailability', () => {
    it('should validate when all required variables are provided', () => {
      const template = {
        content: 'Hello {{name}}, port: {{port}}'
      };

      const providedVariables = {
        name: 'John',
        port: 8080
      };

      const result = validator.validateVariableAvailability(template, providedVariables);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when required variables are missing', () => {
      const template = {
        content: 'Hello {{name}}, welcome to {{place}}!'
      };

      const providedVariables = {
        name: 'John'
        // Missing 'place' variable
      };

      const result = validator.validateVariableAvailability(template, providedVariables);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required variable: place');
    });

    it('should fail when variables are null or undefined', () => {
      const template = {
        content: 'Value: {{value}}, Name: {{name}}'
      };

      const providedVariables = {
        value: null,
        name: undefined
      };

      const result = validator.validateVariableAvailability(template, providedVariables);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Variable value is null or undefined');
      expect(result.errors).toContain('Variable name is null or undefined');
    });

    it('should pass when no variables are required', () => {
      const template = {
        content: 'Static content'
      };

      const result = validator.validateVariableAvailability(template, {});
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle extra provided variables gracefully', () => {
      const template = {
        content: 'Hello {{name}}!'
      };

      const providedVariables = {
        name: 'John',
        extraVariable: 'not used'
      };

      const result = validator.validateVariableAvailability(template, providedVariables);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});