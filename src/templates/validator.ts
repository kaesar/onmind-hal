import { TemplateError } from '../utils/errors.js';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Template validation schema interface
 */
export interface TemplateSchema {
  requiredFields: string[];
  optionalFields: string[];
  fieldTypes: Record<string, string>;
  customValidators?: Record<string, (value: any) => boolean>;
}

/**
 * Template validator for checking template structure and required variables
 */
export class TemplateValidator {
  private readonly schemas: Map<string, TemplateSchema> = new Map();

  constructor() {
    this.initializeDefaultSchemas();
  }

  /**
   * Validate template structure and content
   * @param templateName Name of the template for error reporting
   * @param templateData Template data to validate
   * @param schemaName Optional schema name to use for validation
   * @returns ValidationResult
   */
  validate(templateName: string, templateData: any, schemaName?: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Basic structure validation
    if (!this.validateBasicStructure(templateData, result)) {
      result.isValid = false;
      return result;
    }

    // Schema-based validation if schema is specified
    if (schemaName && this.schemas.has(schemaName)) {
      this.validateAgainstSchema(templateData, this.schemas.get(schemaName)!, result);
    }

    // Variable validation
    this.validateVariables(templateData, result);

    // Content validation
    this.validateContent(templateData, result);

    return result;
  }

  /**
   * Validate template and throw error if invalid
   * @param templateName Name of the template
   * @param templateData Template data to validate
   * @param schemaName Optional schema name
   */
  validateOrThrow(templateName: string, templateData: any, schemaName?: string): void {
    const result = this.validate(templateName, templateData, schemaName);
    
    if (!result.isValid) {
      const errorMessage = result.errors.join('; ');
      throw new TemplateError(templateName, `Validation failed: ${errorMessage}`);
    }
  }

  /**
   * Register a custom validation schema
   * @param name Schema name
   * @param schema Schema definition
   */
  registerSchema(name: string, schema: TemplateSchema): void {
    this.schemas.set(name, schema);
  }

  /**
   * Check if template has required variables in content
   * @param templateData Template data
   * @returns string[] Array of required variable names
   */
  extractRequiredVariables(templateData: any): string[] {
    const variables = new Set<string>();
    const content = this.getTemplateContent(templateData);
    
    if (typeof content === 'string') {
      const variablePattern = /\{\{(\w+)\}\}/g;
      let match;
      
      while ((match = variablePattern.exec(content)) !== null) {
        variables.add(match[1]);
      }
    } else if (typeof content === 'object') {
      // Recursively extract variables from object content
      this.extractVariablesFromObject(content, variables);
    }

    return Array.from(variables);
  }

  /**
   * Validate that all required variables are defined
   * @param templateData Template data
   * @param providedVariables Variables provided for rendering
   * @returns ValidationResult
   */
  validateVariableAvailability(templateData: any, providedVariables: Record<string, any>): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    const requiredVariables = this.extractRequiredVariables(templateData);
    
    for (const variable of requiredVariables) {
      if (!(variable in providedVariables)) {
        result.errors.push(`Missing required variable: ${variable}`);
        result.isValid = false;
      } else if (providedVariables[variable] === null || providedVariables[variable] === undefined) {
        result.errors.push(`Variable ${variable} is null or undefined`);
        result.isValid = false;
      }
    }

    return result;
  }

  /**
   * Initialize default validation schemas
   */
  private initializeDefaultSchemas(): void {
    // Docker template schema
    this.registerSchema('docker', {
      requiredFields: ['commands'],
      optionalFields: ['variables', 'dependencies'],
      fieldTypes: {
        commands: 'object',
        variables: 'array',
        dependencies: 'array'
      },
      customValidators: {
        commands: (value) => {
          return typeof value === 'object' && 
                 ('install' in value || 'setup' in value || 'run' in value);
        }
      }
    });

    // Service template schema
    this.registerSchema('service', {
      requiredFields: ['name'],
      optionalFields: ['image', 'ports', 'volumes', 'environment', 'depends_on'],
      fieldTypes: {
        name: 'string',
        image: 'string',
        ports: 'array',
        volumes: 'array',
        environment: 'object'
      }
    });

    // Config template schema
    this.registerSchema('config', {
      requiredFields: ['filename', 'content'],
      optionalFields: ['variables', 'permissions'],
      fieldTypes: {
        filename: 'string',
        content: 'string',
        variables: 'array',
        permissions: 'string'
      }
    });
  }

  /**
   * Validate basic template structure
   */
  private validateBasicStructure(templateData: any, result: ValidationResult): boolean {
    if (!templateData || typeof templateData !== 'object') {
      result.errors.push('Template must be a valid JSON object');
      return false;
    }

    return true;
  }

  /**
   * Validate against a specific schema
   */
  private validateAgainstSchema(templateData: any, schema: TemplateSchema, result: ValidationResult): void {
    // Check required fields
    for (const field of schema.requiredFields) {
      if (!(field in templateData)) {
        result.errors.push(`Missing required field: ${field}`);
        result.isValid = false;
      }
    }

    // Check field types
    for (const [field, expectedType] of Object.entries(schema.fieldTypes)) {
      if (field in templateData) {
        const actualType = Array.isArray(templateData[field]) ? 'array' : typeof templateData[field];
        if (actualType !== expectedType) {
          result.errors.push(`Field ${field} should be ${expectedType}, got ${actualType}`);
          result.isValid = false;
        }
      }
    }

    // Run custom validators
    if (schema.customValidators) {
      for (const [field, validator] of Object.entries(schema.customValidators)) {
        if (field in templateData && !validator(templateData[field])) {
          result.errors.push(`Custom validation failed for field: ${field}`);
          result.isValid = false;
        }
      }
    }

    // Check for unexpected fields
    const allowedFields = [...schema.requiredFields, ...schema.optionalFields];
    for (const field of Object.keys(templateData)) {
      if (!allowedFields.includes(field)) {
        result.warnings.push(`Unexpected field: ${field}`);
      }
    }
  }

  /**
   * Validate variables section
   */
  private validateVariables(templateData: any, result: ValidationResult): void {
    if ('variables' in templateData) {
      const variables = templateData.variables;
      
      if (variables !== null && typeof variables !== 'object') {
        result.errors.push('Variables must be an object or array');
        result.isValid = false;
      }
    }
  }

  /**
   * Validate content section
   */
  private validateContent(templateData: any, result: ValidationResult): void {
    const content = this.getTemplateContent(templateData);
    
    if (content !== undefined && typeof content !== 'string' && typeof content !== 'object') {
      result.errors.push('Template content must be a string or object');
      result.isValid = false;
    }
  }

  /**
   * Get template content from template data
   */
  private getTemplateContent(templateData: any): any {
    return templateData.content !== undefined ? templateData.content : templateData;
  }

  /**
   * Recursively extract variables from object content
   */
  private extractVariablesFromObject(obj: any, variables: Set<string>): void {
    if (typeof obj === 'string') {
      const variablePattern = /\{\{(\w+)\}\}/g;
      let match;
      
      while ((match = variablePattern.exec(obj)) !== null) {
        variables.add(match[1]);
      }
    } else if (Array.isArray(obj)) {
      for (const item of obj) {
        this.extractVariablesFromObject(item, variables);
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const value of Object.values(obj)) {
        this.extractVariablesFromObject(value, variables);
      }
    }
  }
}