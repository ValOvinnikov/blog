import type { TListedLead } from '@blog/db/queries/leads';

export const makeLead = (
  overrides: Partial<TListedLead> = {},
): TListedLead => ({
  id: 'lead-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'Hello there',
  sourcePath: '/contact',
  sourceDocumentId: null,
  sourceLocale: null,
  readAt: null,
  createdAt: new Date('2026-04-02T09:30:00.000Z'),
  ...overrides,
});
