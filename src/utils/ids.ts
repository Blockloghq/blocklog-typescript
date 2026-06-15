import { randomUUID } from 'crypto';

export function generateUUID(): string {
  return randomUUID();
}

export function generateIdempotencyKey(prefix: string = 'blk'): string {
  return `${prefix}_${randomUUID().replace(/-/g, '').substring(0, 32)}`;
}
