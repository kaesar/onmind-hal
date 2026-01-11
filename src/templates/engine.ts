import { readFile } from 'fs/promises';
import { join } from 'path';
import { Template } from '../core/types.js';
import { TemplateError } from '../utils/errors.js';

/**
 * Template processing engine for HomeLab application
 * Handles loading, validation, and rendering of JSON templates with variable interpolation
 */
export class TemplateEngine {
  private templateCache = new Map<string, Template>();
  private readonly templateDir: string;

  constructor(templateDir: string = 'templates') {
    this.templateDir = templateDir;
  }

  /**
   * Load a template from YAML or JSON file
   * @param templateName Name of the template file (without extension)
   * @returns Promise<Template>
   */
  async load(templateName: string): Promise<Template> {
    // Check cache first
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    try {
      // Try YAML first, then JSON
      let templatePath = join(this.templateDir, `${templateName}.yml`);
      let fileContent: string;
      let templateData: any;
      
      try {
        fileContent = await readFile(templatePath, 'utf-8');
        templateData = Bun.YAML.parse(fileContent);
      } catch (yamlError) {
        // Fallback to JSON
        templatePath = join(this.templateDir, `${templateName}.json`);
        fileContent = await readFile(templatePath, 'utf-8');
        templateData = JSON.parse(fileContent);
      }

      // Validate basic template structure
      this.validateTemplateStructure(templateName, templateData);

      const template: Template = {
        name: templateName,
        content: JSON.stringify(templateData.content || templateData),
        variables: templateData.variables || {},
        render: (context: Record<string, any>) => this.render(template, context)
      };

      // Cache the template
      this.templateCache.set(templateName, template);
      return template;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new TemplateError(templateName, `Invalid format: ${error.message}`);
      }
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        throw new TemplateError(templateName, `Template file not found: ${templateName}.yml or ${templateName}.json`);
      }
      throw new TemplateError(templateName, `Failed to load template: ${error}`);
    }
  }

  /**
   * Validate template structure
   * @param templateName Name of the template for error reporting
   * @param templateData Parsed JSON data
   */
  validate(templateName: string, templateData: any): void {
    this.validateTemplateStructure(templateName, templateData);
  }

  /**
   * Render template with variable interpolation
   * @param template Template object
   * @param context Variables to interpolate
   * @returns Rendered string
   */
  render(template: Template, context: Record<string, any>): string {
    try {
      let rendered = template.content;

      // Extract variables from template content
      const variablePattern = /\{\{(\w+)\}\}/g;
      const requiredVariables = new Set<string>();
      let match;

      while ((match = variablePattern.exec(template.content)) !== null) {
        requiredVariables.add(match[1]);
      }

      // Validate that all required variables are provided
      for (const variable of requiredVariables) {
        if (!(variable in context)) {
          throw new TemplateError(template.name, `Missing required variable: ${variable}`);
        }
      }

      // Perform variable interpolation
      rendered = rendered.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
        const value = context[variableName];
        if (value === undefined || value === null) {
          throw new TemplateError(template.name, `Variable ${variableName} is null or undefined`);
        }
        return String(value);
      });

      return rendered;
    } catch (error) {
      if (error instanceof TemplateError) {
        throw error;
      }
      throw new TemplateError(template.name, `Rendering failed: ${error}`);
    }
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    this.templateCache.clear();
  }

  /**
   * Get cached template names
   */
  getCachedTemplates(): string[] {
    return Array.from(this.templateCache.keys());
  }

  /**
   * Internal method to validate template structure
   */
  private validateTemplateStructure(templateName: string, templateData: any): void {
    if (!templateData || typeof templateData !== 'object') {
      throw new TemplateError(templateName, 'Template must be a valid JSON object');
    }

    // Template can have either 'content' property or be the content itself
    if (templateData.content !== undefined) {
      if (typeof templateData.content !== 'string' && typeof templateData.content !== 'object') {
        throw new TemplateError(templateName, 'Template content must be a string or object');
      }
    }

    // If variables are specified, they should be an object
    if (templateData.variables !== undefined && typeof templateData.variables !== 'object') {
      throw new TemplateError(templateName, 'Template variables must be an object');
    }
  }
}