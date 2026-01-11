/**
 * Integration tests for ConfigurationManager
 */

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { ConfigurationManager, ConfigFile, BackupInfo } from '../../src/core/config.js';
import { HomelabConfig, ServiceType, DistributionType } from '../../src/core/types.js';
import { HomelabError } from '../../src/utils/errors.js';
import { TemplateEngine } from '../../src/templates/engine.js';
import { mkdir, writeFile, readFile, rmdir, access } from 'fs/promises';
import { join } from 'path';

// Test configuration
const testConfig: HomelabConfig = {
  ip: '192.168.1.100',
  domain: 'homelab.local',
  networkName: 'homelab-network',
  selectedServices: [ServiceType.CADDY, ServiceType.PORTAINER, ServiceType.COPYPARTY, ServiceType.N8N, ServiceType.POSTGRESQL, ServiceType.MARIADB],
  distribution: DistributionType.UBUNTU,
  storagePassword: 'test-password'
};

// Mock template engine
const mockTemplateEngine = {
  load: mock(() => Promise.resolve({
    name: 'test-template',
    content: 'Test template content with {{domain}} and {{ip}}',
    variables: { domain: '', ip: '' },
    render: mock((context: Record<string, any>) => {
      return `Generated config for ${context.domain} at ${context.ip}`;
    })
  })),
  render: mock(() => 'rendered content'),
  clearCache: mock(() => {}),
  getCachedTemplates: mock(() => [])
};

describe('ConfigurationManager Integration Tests', () => {
  let configManager: ConfigurationManager;
  let testConfigDir: string;
  let testBackupDir: string;

  beforeEach(async () => {
    // Create temporary directories for testing
    testConfigDir = './test-config';
    testBackupDir = './test-config/backups';
    
    // Clean up any existing test directories
    try {
      await rmdir(testConfigDir, { recursive: true });
    } catch {
      // Ignore if directory doesn't exist
    }

    // Create configuration manager with test directories
    configManager = new ConfigurationManager(
      mockTemplateEngine as any,
      testConfigDir,
      testBackupDir
    );

    // Reset mocks
    mock.restore();
  });

  afterEach(async () => {
    // Clean up test directories
    try {
      await rmdir(testConfigDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Configuration Generation', () => {
    it('should generate all configuration files successfully', async () => {
      // Mock template loading for all config files
      mockTemplateEngine.load.mockImplementation((templateName: string) => {
        return Promise.resolve({
          name: templateName,
          content: `Template content for ${templateName} with {{domain}} and {{ip}}`,
          variables: { domain: '', ip: '' },
          render: mock((context: Record<string, any>) => {
            return `Generated ${templateName} config for ${context.domain} at ${context.ip}`;
          })
        });
      });

      const configFiles = await configManager.generateConfigurations(testConfig);

      // Verify that configuration files were generated
      expect(configFiles.length).toBeGreaterThan(0);
      
      // Check that core config files are present
      const configNames = configFiles.map(f => f.name);
      expect(configNames).toContain('Caddyfile');
      expect(configNames).toContain('dnsmasq.conf');
      expect(configNames).toContain('copyparty.conf');

      // Verify template engine was called for each config
      expect(mockTemplateEngine.load).toHaveBeenCalledWith('config/caddyfile');
      expect(mockTemplateEngine.load).toHaveBeenCalledWith('config/dnsmasq');
      expect(mockTemplateEngine.load).toHaveBeenCalledWith('config/copyparty');

      // Verify files were actually written to disk
      for (const configFile of configFiles) {
        const fileExists = await access(configFile.path).then(() => true).catch(() => false);
        expect(fileExists).toBe(true);
        
        const fileContent = await readFile(configFile.path, 'utf-8');
        expect(fileContent).toBe(configFile.content);
      }
    });

    it('should generate service-specific configurations', async () => {
      // Mock template loading for service configs
      mockTemplateEngine.load.mockImplementation((templateName: string) => {
        if (templateName.includes('n8n')) {
          return Promise.resolve({
            name: templateName,
            content: 'n8n config template with {{domain}}',
            variables: { domain: '' },
            render: mock((context: Record<string, any>) => {
              return `n8n config for ${context.domain}`;
            })
          });
        }
        // Return default template for other configs
        return Promise.resolve({
          name: templateName,
          content: `Template for ${templateName}`,
          variables: {},
          render: mock(() => `Generated ${templateName}`)
        });
      });

      const configFiles = await configManager.generateConfigurations(testConfig);

      // Verify service-specific configs were attempted
      expect(mockTemplateEngine.load).toHaveBeenCalledWith('config/n8n');
    });

    it('should handle template loading errors gracefully', async () => {
      // Mock template loading failure for core configs
      mockTemplateEngine.load.mockImplementation(() => {
        return Promise.reject(new Error('Template not found'));
      });

      // Should throw HomelabError for core config failures
      await expect(configManager.generateConfigurations(testConfig)).rejects.toThrow(HomelabError);
    });
  });

  describe('Backup and Restore', () => {
    it('should backup existing configuration files', async () => {
      // Create some existing config files
      await mkdir(testConfigDir, { recursive: true });
      const existingFiles = [
        { name: 'Caddyfile', content: 'existing caddy config' },
        { name: 'dnsmasq.conf', content: 'existing dnsmasq config' }
      ];

      for (const file of existingFiles) {
        await writeFile(join(testConfigDir, file.name), file.content);
      }

      // Create config files to backup
      const configFiles: ConfigFile[] = existingFiles.map(f => ({
        name: f.name,
        path: join(testConfigDir, f.name),
        content: f.content
      }));

      const backups = await configManager.backupExistingConfigurations(configFiles);

      // Verify backups were created
      expect(backups.length).toBe(existingFiles.length);
      
      for (const backup of backups) {
        const backupExists = await access(backup.backupPath).then(() => true).catch(() => false);
        expect(backupExists).toBe(true);
        
        const backupContent = await readFile(backup.backupPath, 'utf-8');
        const originalContent = await readFile(backup.originalPath, 'utf-8');
        expect(backupContent).toBe(originalContent);
      }
    });

    it('should restore files from backup', async () => {
      // Create original files
      await mkdir(testConfigDir, { recursive: true });
      await mkdir(testBackupDir, { recursive: true });
      
      const originalContent = 'original content';
      const modifiedContent = 'modified content';
      const filePath = join(testConfigDir, 'test.conf');
      const backupPath = join(testBackupDir, 'test.conf.backup.2023-01-01T00-00-00-000Z');

      // Create original and backup files
      await writeFile(filePath, originalContent);
      await writeFile(backupPath, originalContent);
      
      // Modify original file
      await writeFile(filePath, modifiedContent);

      // Create backup info
      const backupInfo: BackupInfo = {
        originalPath: filePath,
        backupPath: backupPath,
        timestamp: new Date('2023-01-01T00:00:00.000Z')
      };

      // Restore from backup
      await configManager.restoreFromBackup([backupInfo]);

      // Verify file was restored
      const restoredContent = await readFile(filePath, 'utf-8');
      expect(restoredContent).toBe(originalContent);
    });

    it('should handle missing backup files gracefully', async () => {
      const backupInfo: BackupInfo = {
        originalPath: join(testConfigDir, 'nonexistent.conf'),
        backupPath: join(testBackupDir, 'nonexistent.conf.backup.2023-01-01T00-00-00-000Z'),
        timestamp: new Date('2023-01-01T00:00:00.000Z')
      };

      // Should not throw error for missing backup files
      await expect(configManager.restoreFromBackup([backupInfo])).resolves.toBeUndefined();
    });
  });

  describe('Configuration Validation', () => {
    it('should validate configuration files successfully', async () => {
      // Create test config files
      await mkdir(testConfigDir, { recursive: true });
      
      const configFiles: ConfigFile[] = [
        {
          name: 'test1.conf',
          path: join(testConfigDir, 'test1.conf'),
          content: 'valid config content'
        },
        {
          name: 'test2.conf',
          path: join(testConfigDir, 'test2.conf'),
          content: 'another valid config'
        }
      ];

      // Write files to disk
      for (const configFile of configFiles) {
        await writeFile(configFile.path, configFile.content);
      }

      const isValid = await configManager.validateConfigurations(configFiles);
      expect(isValid).toBe(true);
    });

    it('should fail validation for missing files', async () => {
      const configFiles: ConfigFile[] = [
        {
          name: 'missing.conf',
          path: join(testConfigDir, 'missing.conf'),
          content: 'content'
        }
      ];

      await expect(configManager.validateConfigurations(configFiles)).rejects.toThrow(HomelabError);
    });

    it('should fail validation for empty files', async () => {
      const configFiles: ConfigFile[] = [
        {
          name: 'empty.conf',
          path: join(testConfigDir, 'empty.conf'),
          content: ''
        }
      ];

      await expect(configManager.validateConfigurations(configFiles)).rejects.toThrow(HomelabError);
    });
  });

  describe('Cleanup Operations', () => {
    it('should cleanup generated configuration files', async () => {
      // Generate some config files first
      mockTemplateEngine.load.mockImplementation(() => {
        return Promise.resolve({
          name: 'test-template',
          content: 'test content',
          variables: {},
          render: mock(() => 'generated content')
        });
      });

      const configFiles = await configManager.generateConfigurations(testConfig);
      
      // Verify files exist
      for (const configFile of configFiles) {
        const fileExists = await access(configFile.path).then(() => true).catch(() => false);
        expect(fileExists).toBe(true);
      }

      // Cleanup generated files
      await configManager.cleanupGeneratedFiles();

      // Verify files were deleted
      for (const configFile of configFiles) {
        const fileExists = await access(configFile.path).then(() => true).catch(() => false);
        expect(fileExists).toBe(false);
      }
    });

    it('should list existing backups', async () => {
      // Create backup directory and some backup files
      await mkdir(testBackupDir, { recursive: true });
      
      const backupFiles = [
        'test1.conf.backup.2023-01-01T00-00-00-000Z',
        'test2.conf.backup.2023-01-02T00-00-00-000Z'
      ];

      for (const backupFile of backupFiles) {
        await writeFile(join(testBackupDir, backupFile), 'backup content');
      }

      const backups = await configManager.listBackups();
      
      expect(backups.length).toBe(backupFiles.length);
      
      // Check that timestamps are valid dates
      for (const backup of backups) {
        expect(backup.timestamp).toBeInstanceOf(Date);
        expect(isNaN(backup.timestamp.getTime())).toBe(false);
      }
      
      // Should be sorted by timestamp desc (newer first)
      if (backups.length > 1) {
        expect(backups[0].timestamp.getTime()).toBeGreaterThan(backups[1].timestamp.getTime());
      }
    });
  });

  describe('Getter Methods', () => {
    it('should provide access to generated files and backups', async () => {
      // Initially should be empty
      expect(configManager.getGeneratedFiles()).toEqual([]);
      expect(configManager.getBackups()).toEqual([]);

      // Generate some configs
      mockTemplateEngine.load.mockImplementation(() => {
        return Promise.resolve({
          name: 'test-template',
          content: 'test content',
          variables: {},
          render: mock(() => 'generated content')
        });
      });

      await configManager.generateConfigurations(testConfig);
      
      // Should have generated files
      expect(configManager.getGeneratedFiles().length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle file system errors gracefully', async () => {
      // Try to generate configs in a read-only directory (simulate permission error)
      const readOnlyConfigManager = new ConfigurationManager(
        mockTemplateEngine as any,
        '/root/readonly-config', // This should fail on most systems
        '/root/readonly-backup'
      );

      mockTemplateEngine.load.mockImplementation(() => {
        return Promise.resolve({
          name: 'test-template',
          content: 'test content',
          variables: {},
          render: mock(() => 'generated content')
        });
      });

      // Should handle permission errors gracefully
      await expect(readOnlyConfigManager.generateConfigurations(testConfig)).rejects.toThrow(HomelabError);
    });
  });
});