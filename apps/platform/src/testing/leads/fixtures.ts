import type { TLead } from '@blog/db/schema/leads';

export const makeLead = (overrides: Partial<TLead> = {}): TLead => ({
  id: 'lead-1',
  tenantId: 'tenant-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'Hello there',
  sourcePath: '/contact',
  createdAt: new Date('2026-04-02T09:30:00.000Z'),
  ...overrides,
});
