/**
 * Type definitions for Bun runtime
 */

declare module 'bun' {
  export function spawn(command: string[], options?: any): any;
  export const $: any;
}

// Global Timer type for Bun
declare global {
  type Timer = any;
}