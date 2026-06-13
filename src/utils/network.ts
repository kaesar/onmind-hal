/**
 * Network utilities for domain and IP validation
 */

import { $ } from 'bun';

export class NetworkUtils {
  /**
   * Check if domain is local (.lan, .local, localhost, or private IP ranges)
   */
  static isLocalDomain(domain: string, ip?: string): boolean {
    const localTlds = ['.lan', '.local', 'localhost'];
    
    // Check for explicit local TLDs
    if (localTlds.some(tld => domain.endsWith(tld))) {
      return true;
    }
    
    // Check if IP is in private ranges
    if (ip && this.isPrivateIP(ip)) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if IP is in private ranges (RFC 1918)
   */
  static isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^10\./,                    // 10.0.0.0/8
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // 172.16.0.0/12
      /^192\.168\./,              // 192.168.0.0/16
      /^127\./,                   // 127.0.0.0/8 (localhost)
    ];
    
    return privateRanges.some(range => range.test(ip));
  }

  /**
   * Detect the primary local private IP address
   * Tries multiple methods and returns the first private, non-loopback IP found
   */
  static async detectLocalIP(): Promise<string | null> {
    const candidates = await this.collectCandidateIPs();

    for (const ip of candidates) {
      const trimmed = ip.trim();
      if (trimmed && this.isPrivateIP(trimmed) && !trimmed.startsWith('127.')) {
        return trimmed;
      }
    }

    return null;
  }

  /**
   * Collect IP candidates from multiple sources
   */
  private static async collectCandidateIPs(): Promise<string[]> {
    const ips: string[] = [];

    // Method 1: ip route get (most reliable for primary interface)
    try {
      const result = await $`ip route get 1.1.1.1`.quiet();
      const match = result.stdout.toString().match(/src\s+(\S+)/);
      if (match) ips.push(match[1]);
    } catch {}

    // Method 2: hostname -I (all non-loopback addresses)
    try {
      const result = await $`hostname -I`.quiet();
      const parts = result.stdout.toString().trim().split(/\s+/);
      ips.push(...parts.filter(Boolean));
    } catch {}

    // Method 3: ip -4 addr (exclude docker bridges)
    try {
      const result = await $`ip -4 addr show`.quiet();
      const matches = result.stdout.toString().matchAll(/inet\s+(\S+)/g);
      for (const m of matches) {
        const ip = m[1].split('/')[0];
        if (!ip.startsWith('172.') || !ips.includes(ip)) {
          ips.push(ip);
        }
      }
    } catch {}

    // Method 4 (macOS): route get default + ifconfig
    try {
      const routeResult = await $`route get default`.quiet();
      const ifaceMatch = routeResult.stdout.toString().match(/interface:\s+(\S+)/);
      if (ifaceMatch) {
        const iface = ifaceMatch[1];
        const ifconfigResult = await $`ifconfig ${iface}`.quiet();
        const ipMatch = ifconfigResult.stdout.toString().match(/inet\s+(\S+)/);
        if (ipMatch) ips.push(ipMatch[1]);
      }
    } catch {}

    // Method 5 (macOS): ifconfig all interfaces
    try {
      const result = await $`ifconfig`.quiet();
      const matches = result.stdout.toString().matchAll(/inet\s+(\S+)/g);
      for (const m of matches) {
        const ip = m[1].split(' ')[0];
        if (ip && !ip.startsWith('127.') && !ips.includes(ip)) {
          ips.push(ip);
        }
      }
    } catch {}

    return ips;
  }
}