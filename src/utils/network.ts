/**
 * Network utilities for domain and IP validation
 */

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
}