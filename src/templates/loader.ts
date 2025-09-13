import { readFile, readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';
import { TemplateError } from '../utils/errors.js';

/**
 * Template loader for reading JSON template files from filesystem
 */
export class TemplateLoader {
  private readonly templateDir: string;

  constructor(templateDir: string = 'templates') {
    this.templateDir = templateDir;
  }

  /**
   * Load a single template file by name
   * @param templateName Name of the template (without .json extension)
   * @returns Promise<any> Parsed JSON content
   */
  async loadTemplate(templateName: string): Promise<any> {
    try {
      const templatePath = join(this.templateDir, `${templateName}.json`);
      const fileContent = await readFile(templatePath, 'utf-8');
      return JSON.parse(fileContent);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new TemplateError(templateName, `Invalid JSON format: ${error.message}`);
      }
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        throw new TemplateError(templateName, `Template file not found: ${templateName}.json`);
      }
      throw new TemplateError(templateName, `Failed to load template: ${error}`);
    }
  }

  /**
   * Load all templates from a directory
   * @param subdirectory Optional subdirectory within template directory
   * @returns Promise<Map<string, any>> Map of template name to parsed content
   */
  async loadAllTemplates(subdirectory?: string): Promise<Map<string, any>> {
    const templates = new Map<string, any>();
    const targetDir = subdirectory ? join(this.templateDir, subdirectory) : this.templateDir;

    try {
      const files = await readdir(targetDir);
      
      for (const file of files) {
        if (extname(file) === '.json') {
          const templateName = basename(file, '.json');
          const fullPath = subdirectory ? `${subdirectory}/${templateName}` : templateName;
          
          try {
            const content = await this.loadTemplate(fullPath);
            templates.set(templateName, content);
          } catch (error) {
            // Log error but continue loading other templates
            console.warn(`Warning: Failed to load template ${file}: ${error}`);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        throw new TemplateError('directory', `Template directory not found: ${targetDir}`);
      }
      throw new TemplateError('directory', `Failed to read template directory: ${error}`);
    }

    return templates;
  }

  /**
   * Check if a template file exists
   * @param templateName Name of the template
   * @returns Promise<boolean>
   */
  async templateExists(templateName: string): Promise<boolean> {
    try {
      const templatePath = join(this.templateDir, `${templateName}.json`);
      const stats = await stat(templatePath);
      return stats.isFile();
    } catch {
      return false;
    }
  }

  /**
   * List all available template names in a directory
   * @param subdirectory Optional subdirectory within template directory
   * @returns Promise<string[]> Array of template names (without .json extension)
   */
  async listTemplates(subdirectory?: string): Promise<string[]> {
    const targetDir = subdirectory ? join(this.templateDir, subdirectory) : this.templateDir;
    
    try {
      const files = await readdir(targetDir);
      return files
        .filter(file => extname(file) === '.json')
        .map(file => basename(file, '.json'));
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return []; // Return empty array if directory doesn't exist
      }
      throw new TemplateError('directory', `Failed to list templates: ${error}`);
    }
  }

  /**
   * Get the full path to a template file
   * @param templateName Name of the template
   * @returns string Full path to template file
   */
  getTemplatePath(templateName: string): string {
    return join(this.templateDir, `${templateName}.json`);
  }
}