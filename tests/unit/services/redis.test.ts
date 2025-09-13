import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { RedisService } from '../../../src/services/optional/redis.js';
import { ServiceType, HomelabConfig, DistributionType } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';

// Mock Bun shell
mock.module('bun', () => ({
  $: mock(() => Promise.resolve({ exitCode: 0, stderr: '' }))
}));

describe('RedisService', () => {
  let config: HomelabConfig;
  let templateEngine: TemplateEngine;
  let redisService: RedisService;

  beforeEach(() => {
    config = {
      ip: '192.168.1.100',
      domain: 'homelab.local',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.REDIS],
      distribution: DistributionType.UBUNTU
    };

    templateEngine = new TemplateEngine('tests/fixtures/templates');
    redisService = new RedisService(config, templateEngine);
  });

  it('should initialize as optional service', () => {
    expect(redisService.name).toBe('Redis');
    expect(redisService.type).toBe(ServiceType.REDIS);
    expect(redisService.isCore).toBe(false);
    expect(redisService.dependencies).toEqual([]);
  });

  it('should return correct connection URL', () => {
    const url = redisService.getAccessUrl();
    expect(url).toBe('redis://192.168.1.100:6379');
  });
});