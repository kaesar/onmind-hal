/**
 * Unit tests for CLI prompts and validation functions
 */

import { describe, it, expect } from 'bun:test';
import {
  validateIP,
  validateDomain,
  validateNetworkName,
  validatePassword
} from '../../../src/cli/prompts.js';

describe('CLI Prompts Validation', () => {
  describe('validateIP', () => {
    it('should accept valid IP addresses', () => {
      expect(validateIP('192.168.1.1')).toBe(true);
      expect(validateIP('10.0.0.1')).toBe(true);
      expect(validateIP('172.16.0.1')).toBe(true);
      expect(validateIP('255.255.255.255')).toBe(true);
      expect(validateIP('0.0.0.0')).toBe(true);
    });

    it('should reject invalid IP addresses', () => {
      expect(validateIP('256.1.1.1')).toBe('Please enter a valid IP address (e.g., 192.168.1.100)');
      expect(validateIP('192.168.1')).toBe('Please enter a valid IP address (e.g., 192.168.1.100)');
      expect(validateIP('192.168.1.256')).toBe('Please enter a valid IP address (e.g., 192.168.1.100)');
      expect(validateIP('not.an.ip.address')).toBe('Please enter a valid IP address (e.g., 192.168.1.100)');
      expect(validateIP('192.168.1.1.1')).toBe('Please enter a valid IP address (e.g., 192.168.1.100)');
    });

    it('should reject empty input', () => {
      expect(validateIP('')).toBe('IP address is required');
      expect(validateIP('   ')).toBe('IP address is required');
    });

    it('should handle whitespace correctly', () => {
      expect(validateIP('  192.168.1.1  ')).toBe(true);
    });
  });

  describe('validateDomain', () => {
    it('should accept valid domain names', () => {
      expect(validateDomain('example.com')).toBe(true);
      expect(validateDomain('homelab.local')).toBe(true);
      expect(validateDomain('sub.domain.com')).toBe(true);
      expect(validateDomain('test-domain.org')).toBe(true);
      expect(validateDomain('my-homelab.example.com')).toBe(true);
    });

    it('should reject invalid domain names', () => {
      expect(validateDomain('invalid..domain')).toBe('Please enter a valid domain (e.g., homelab.lan or example.com)');
      expect(validateDomain('.com')).toBe('Please enter a valid domain (e.g., homelab.lan or example.com)');
      expect(validateDomain('domain.')).toBe('Please enter a valid domain (e.g., homelab.lan or example.com)');
      expect(validateDomain('-domain.com')).toBe('Please enter a valid domain (e.g., homelab.lan or example.com)');
      expect(validateDomain('domain-.com')).toBe('Please enter a valid domain (e.g., homelab.lan or example.com)');
    });

    it('should reject empty input', () => {
      expect(validateDomain('')).toBe('Domain is required');
      expect(validateDomain('   ')).toBe('Domain is required');
    });

    it('should handle whitespace correctly', () => {
      expect(validateDomain('  example.com  ')).toBe(true);
    });
  });

  describe('validateNetworkName', () => {
    it('should accept valid network names', () => {
      expect(validateNetworkName('homelab-network')).toBe(true);
      expect(validateNetworkName('my_network')).toBe(true);
      expect(validateNetworkName('network123')).toBe(true);
      expect(validateNetworkName('test-net-01')).toBe(true);
    });

    it('should reject invalid network names', () => {
      expect(validateNetworkName('-invalid')).toBe('Network name can only contain letters, numbers, hyphens, and underscores');
      expect(validateNetworkName('invalid-')).toBe('Network name can only contain letters, numbers, hyphens, and underscores');
      expect(validateNetworkName('invalid name')).toBe('Network name can only contain letters, numbers, hyphens, and underscores');
      expect(validateNetworkName('invalid@name')).toBe('Network name can only contain letters, numbers, hyphens, and underscores');
    });

    it('should reject empty or too short input', () => {
      expect(validateNetworkName('')).toBe('Network name is required');
      expect(validateNetworkName('a')).toBe('Network name must be at least 2 characters long');
      expect(validateNetworkName('   ')).toBe('Network name is required');
    });

    it('should handle whitespace correctly', () => {
      expect(validateNetworkName('  valid-network  ')).toBe(true);
    });
  });

  describe('validatePassword', () => {
    it('should accept valid passwords', () => {
      expect(validatePassword('mySecurePass!')).toBe(true);
      expect(validatePassword('StrongPassword123')).toBe(true);
      expect(validatePassword('a'.repeat(20))).toBe(true);
    });

    it('should reject short passwords', () => {
      expect(validatePassword('short')).toBe('Password must be at least 8 characters long');
      expect(validatePassword('1234567')).toBe('Password must be at least 8 characters long');
    });

    it('should reject empty input', () => {
      expect(validatePassword('')).toBe('Password is required');
      expect(validatePassword('   ')).toBe('Password is required');
    });

    it('should handle whitespace correctly', () => {
      expect(validatePassword('  password123  ')).toBe(true);
    });
  });
});