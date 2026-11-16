import { faker } from '@faker-js/faker';
import { SUSPENSION_CATEGORY } from '@shinefold/db/constants';
import type { TOpenTenantSuspension } from '@shinefold/db/queries/tenant-suspensions';

export const MOCK_SUSPENSION_REFERENCE = 'SUS-000042';
export const MOCK_SUSPENSION_DESCRIPTION = faker.lorem.sentence();
export const MOCK_SUSPENDED_BY_EMAIL = faker.internet.email().toLowerCase();
const MOCK_SUSPENDED_AT = faker.date.past({
  refDate: new Date('2026-11-01T00:00:00.000Z'),
});

export const MOCK_SUSPENSION_CASE = {
  category: SUSPENSION_CATEGORY.ILLEGAL_CONTENT,
  description: MOCK_SUSPENSION_DESCRIPTION,
};

export const mockTenantSuspension = (
  overrides: Partial<TOpenTenantSuspension> = {},
): TOpenTenantSuspension => ({
  id: 'suspension-1',
  reference: MOCK_SUSPENSION_REFERENCE,
  tenantId: 'tenant-1',
  ...MOCK_SUSPENSION_CASE,
  suspendedBy: 'admin-1',
  suspendedAt: MOCK_SUSPENDED_AT,
  liftedAt: null,
  liftedBy: null,
  suspendedByEmail: MOCK_SUSPENDED_BY_EMAIL,
  ...overrides,
});
