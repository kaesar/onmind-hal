import { ServiceType, HomelabConfig } from '../../core/types.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';
import { $ } from 'bun';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { ContainerRuntimeUtils } from '../../utils/container.js';

/**
 * Tinyauth v5 - Lightweight OIDC authentication server
 * Supports OAuth, LDAP, TOTP and works with Caddy reverse proxy
 */
export class TinyauthService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'Tinyauth',
      ServiceType.TINYAUTH,
      false,
      [],
      config,
      templateEngine
    );
  }

  /**
   * Generate users.txt file for Tinyauth authentication
   */
  protected async generateConfigFiles(): Promise<void> {
    try {
      const homeDir = process.env.HOME || process.env.USERPROFILE || '~';
      const dataDir = join(homeDir, this.config.dataPath, 'tinyauth');
      const usersFile = join(dataDir, 'users.txt');

      // Create directory
      await mkdir(dataDir, { recursive: true });

      // Check if users.txt exists and has content
      try {
        const content = await readFile(usersFile, 'utf-8');
        if (content.trim().length > 0) {
          console.log(`Tinyauth users.txt already exists, keeping current users`);
          return;
        }
      } catch {
        // File doesn't exist, continue to create it
      }

      // Create admin user using Bun's shell
      console.log(`Creating Tinyauth admin user...`);
      const runtime = await ContainerRuntimeUtils.detectRuntime();
      console.log(`Using runtime: ${runtime}`);

      const cmd = `${runtime} run --rm ghcr.io/tinyauthapp/tinyauth:v5 user create --username admin --password '${this.config.storagePassword}'`;
      console.log(`Executing: ${cmd.replace(/--password '.*'/, "--password '***'")}`);

      // Escape $ chars to prevent shell variable expansion in Bun's shell
      const escapedPassword = this.config.storagePassword.replace(/\$/g, '\\$');
      const result = await $`${runtime} run --rm ghcr.io/tinyauthapp/tinyauth:v5 user create --username admin --password ${escapedPassword}`.quiet();
      const output = result.stdout.toString();
      const stderr = result.stderr.toString();
      console.log(`Command output length: ${output.length}`);
      if (stderr) {
        console.log(`Stderr: ${stderr.substring(0, 200)}`);
      }

      // Extract user line (format: user=admin:$2a$10$... or TINYAUTH_AUTH_USERS=admin:$2a$10$...)
      // Use regex to find the pattern anywhere in output, handling various formats
      const cleanOutput = output.replace(/\x1b\[[0-9;]*m/g, '');
      const userMatch = cleanOutput.match(/(?:user|TINYAUTH_AUTH_USERS)=(admin:[^\s]+)/i);
      const userLine = userMatch ? userMatch[1].trim() : null;

      console.log(`Extracted user line: ${userLine ? 'found' : 'not found'}`);
      if (userLine) {
        console.log(`User line preview: ${userLine.substring(0, 50)}...`);
      }

      if (userLine) {
        await writeFile(usersFile, userLine);
        console.log(`Tinyauth user created: ${userLine.split(':')[0]}`);
      } else {
        console.error(`Warning: Failed to create Tinyauth user`);
        console.error(`Raw output: ${output.substring(0, 500)}`);
      }
    } catch (error) {
      console.error(`Failed to generate Tinyauth config: ${error}`);
    }
  }

  getAccessUrl(): string {
    return `https://auth.${this.config.domain}`;
  }
}
