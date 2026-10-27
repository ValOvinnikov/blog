import { DAY_MS } from '@blog/db/constants';

export const MOCK_RETENTION_NOW = new Date('2026-06-15T12:00:00.000Z');

export function justPast(cutoff: Date): Date {
  return new Date(cutoff.getTime() - DAY_MS);
}

export function justWithin(cutoff: Date): Date {
  return new Date(cutoff.getTime() + DAY_MS);
}

export const MOCK_RETENTION_LIMIT = 100;
