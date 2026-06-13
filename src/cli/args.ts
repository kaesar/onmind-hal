import { ServiceType } from '../core/types.js';
import { validateIP as validateIPUtil } from '../utils/validation.js';
import { sanitizeUserInput } from '../utils/validation.js';

const USAGE = `
Usage: hal [options]

Options:
  --ip <address>       Server IP address (auto-detected if omitted)
  --domain <domain>    Domain name (default: homelab.lan)
  --list <services>    Comma-separated list of optional services to include
  --nolist <services>  Comma-separated list of optional services to exclude (all others included)
  --password <base64>  Database password (base64-encoded)
  --help               Show this help message

Note: --list and --nolist are mutually exclusive. --nolist takes priority.
`;

export { USAGE };

export interface CliArgs {
  ip?: string;
  domain?: string;
  list?: string[];
  nolist?: string[];
  password?: string;
  scriptMode?: boolean;
  help?: boolean;
}

function flagValue(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return undefined;
}

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

export function parseArgs(argv: string[]): CliArgs {
  const raw = argv.slice(2);
  if (raw.length === 0) return {};

  if (hasFlag(raw, '--help')) {
    return { scriptMode: true, help: true };
  }

  const hasFlags = raw.some(a => a.startsWith('--'));
  if (!hasFlags) return {};

  let ip: string | undefined;

  const ipFlag = flagValue(raw, '--ip');
  if (ipFlag) {
    try {
      const trimmed = sanitizeUserInput(ipFlag.trim());
      validateIPUtil(trimmed);
      ip = trimmed;
    } catch {}
  }

  const result: CliArgs = { scriptMode: true };
  if (ip) result.ip = ip;

  const domain = flagValue(raw, '--domain');
  if (domain) {
    result.domain = sanitizeUserInput(domain.trim());
  }

  const list = flagValue(raw, '--list');
  const nolist = flagValue(raw, '--nolist');

  if (nolist) {
    result.nolist = nolist
      .split(',')
      .map(s => sanitizeUserInput(s.trim().toLowerCase()))
      .filter(s => s.length > 0 && Object.values(ServiceType).includes(s as ServiceType));
    result.list = undefined;
  } else if (list) {
    result.list = list
      .split(',')
      .map(s => sanitizeUserInput(s.trim().toLowerCase()))
      .filter(s => s.length > 0 && Object.values(ServiceType).includes(s as ServiceType));
  }

  const password = flagValue(raw, '--password');
  if (password) {
    try {
      result.password = Buffer.from(password, 'base64').toString('utf-8');
    } catch {
      result.password = password;
    }
  }

  return result;
}
