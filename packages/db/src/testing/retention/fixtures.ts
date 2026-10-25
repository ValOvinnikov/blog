import { DAY_MS } from '@blog/db/constants';
import { faker } from '@faker-js/faker';

export const MOCK_RETENTION_NOW = faker.date.recent();

export function justPast(cutoff: Date): Date {
  return new Date(cutoff.getTime() - DAY_MS);
}

export function justWithin(cutoff: Date): Date {
  return new Date(cutoff.getTime() + DAY_MS);
}

export const MOCK_RETENTION_LIMIT = 100;
