import type { TListedLead } from '@blog/db/queries/leads';
import type { TInboxLead } from '@platform/server/leads/to-inbox-lead';

const MOCK_LEAD_FIELDS = {
  id: 'lead-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'Hello there',
  sourcePath: '/contact',
  sourceDocumentId: null,
  sourceLocale: null,
  createdAt: new Date('2026-04-02T09:30:00.000Z'),
};

export const mockLead = (
  overrides: Partial<TListedLead> = {},
): TListedLead => ({ ...MOCK_LEAD_FIELDS, readAt: null, ...overrides });

export const mockInboxLead = (
  overrides: Partial<TInboxLead> = {},
): TInboxLead => ({ ...MOCK_LEAD_FIELDS, isRead: false, ...overrides });
