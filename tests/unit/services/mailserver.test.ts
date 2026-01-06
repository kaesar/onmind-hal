import { describe, it, expect, beforeEach } from 'bun:test';
import { MailserverService } from '../../../src/services/optional/mailserver.js';
import { ServiceType, HomelabConfig, DistributionType } from '../../../src/core/types.js';
import { TemplateEngine } from '../../../src/templates/engine.js';
import { TemplateLoader } from '../../../src/templates/loader.js';

describe('MailserverService', () => {
  let service: MailserverService;
  let config: HomelabConfig;
  let templateEngine: TemplateEngine;

  beforeEach(() => {
    config = {
      ip: '192.168.1.100',
      domain: 'homelab.lan',
      networkName: 'homelab-network',
      selectedServices: [ServiceType.MAILSERVER],
      distribution: DistributionType.UBUNTU
    };

    const templateLoader = new TemplateLoader();
    templateEngine = new TemplateEngine(templateLoader);
    service = new MailserverService(config, templateEngine);
  });

  it('should have correct service name', () => {
    expect(service.name).toBe('Docker Mailserver');
  });

  it('should have correct service type', () => {
    expect(service.type).toBe(ServiceType.MAILSERVER);
  });

  it('should not be a core service', () => {
    expect(service.isCore).toBe(false);
  });

  it('should have no dependencies', () => {
    expect(service.dependencies).toEqual([]);
  });

  it('should return correct access URL', () => {
    const url = service.getAccessUrl();
    expect(url).toBe('smtp://192.168.1.100:25');
  });
});
