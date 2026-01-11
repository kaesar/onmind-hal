#!/usr/bin/env bun

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const SERVICES_DIR = 'templates/services';

async function migrateJsonToYaml() {
  console.log('🔄 Migrating JSON templates to YAML...');
  
  const files = await readdir(SERVICES_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  for (const jsonFile of jsonFiles) {
    const serviceName = jsonFile.replace('.json', '');
    const jsonPath = join(SERVICES_DIR, jsonFile);
    const yamlPath = join(SERVICES_DIR, `${serviceName}.yml`);
    
    try {
      // Read JSON
      const jsonContent = await readFile(jsonPath, 'utf-8');
      const data = JSON.parse(jsonContent);
      
      // Convert run command to multi-line format if it's long
      if (data.commands?.run && data.commands.run.length > 80) {
        data.commands.run = formatDockerCommand(data.commands.run);
      }
      
      // Convert to YAML
      const yamlContent = Bun.YAML.stringify(data, 2);
      
      // Write YAML
      await writeFile(yamlPath, yamlContent);
      console.log(`✅ Migrated ${serviceName}: ${jsonFile} → ${serviceName}.yml`);
      
    } catch (error) {
      console.error(`❌ Failed to migrate ${serviceName}:`, error);
    }
  }
  
  console.log('🎉 Migration completed!');
}

function formatDockerCommand(command: string): string {
  // Split docker run command into readable multi-line format
  if (!command.startsWith('docker run')) return command;
  
  return command
    .replace(/docker run/, 'docker run')
    .replace(/ -([a-zA-Z])/g, ' \\\n      -$1')
    .replace(/ --([a-zA-Z])/g, ' \\\n      --$1')
    .replace(/ ([a-zA-Z0-9_-]+\/[a-zA-Z0-9_:-]+)$/, ' \\\n      $1');
}

// Run migration
migrateJsonToYaml().catch(console.error);