import type { TLead } from '@blog/db/schema/leads';
import { TENANT_ID } from '@platform/testing/tenants/fixtures';

export const makeLead = (overrides: Partial<TLead> = {}): TLead => ({
  id: 'lead-1',
  tenantId: TENANT_ID,
  name: 'Ada Lovelace',
  nameEncrypted: null,
  email: 'ada@example.com',
  emailEncrypted: null,
  emailIndex: null,
  message: 'Hello there',
  messageEncrypted: null,
  sourcePath: '/contact',
  sourceDocumentId: null,
  sourceLocale: null,
  readAt: null,
  createdAt: new Date('2026-04-02T09:30:00.000Z'),
  ...overrides,
});
