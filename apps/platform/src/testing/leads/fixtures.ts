import type { TLead } from '@blog/db/schema/leads';

export const makeLead = (overrides: Partial<TLead> = {}): TLead => ({
  id: 'lead-1',
  tenantId: 'tenant-1',
  name: 'Ada Lovelace',
  nameEncrypted: null,
  email: 'ada@example.com',
  emailEncrypted: null,
  emailIndex: null,
  message: 'Hello there',
  messageEncrypted: null,
  sourcePath: '/contact',
  createdAt: new Date('2026-04-02T09:30:00.000Z'),
  ...overrides,
});
