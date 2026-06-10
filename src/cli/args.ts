import { ServiceType } from '../core/types.js';
import { validateIP as validateIPUtil } from '../utils/validation.js';
import { sanitizeUserInput } from '../utils/validation.js';

export interface CliArgs {
  ip?: string;
  domain?: string;
  list?: string[];
  password?: string;
}

function flagValue(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return undefined;
}

export function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);
  if (args.length === 0) return {};

  const first = args[0];
  if (!first || first.startsWith('-')) return {};

  let ip: string | undefined;
  try {
    const trimmed = sanitizeUserInput(first.trim());
    validateIPUtil(trimmed);
    ip = trimmed;
  } catch {
    return {};
  }

  const result: CliArgs = { ip };

  const domain = flagValue(args, '--domain');
  if (domain) {
    result.domain = sanitizeUserInput(domain.trim());
  }

  const list = flagValue(args, '--list');
  if (list) {
    result.list = list
      .split(',')
      .map(s => sanitizeUserInput(s.trim().toLowerCase()))
      .filter(s => s.length > 0 && Object.values(ServiceType).includes(s as ServiceType));
  }

  const password = flagValue(args, '--password');
  if (password) {
    try {
      result.password = Buffer.from(password, 'base64').toString('utf-8');
    } catch {
      result.password = password;
    }
  }

  return result;
}
