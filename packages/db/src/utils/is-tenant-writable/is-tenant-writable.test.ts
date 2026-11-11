import { WRITABLE_TENANT_STATUSES, TENANT_STATUS } from '@blog/db/constants';
import { MOCK_DEPROVISIONED_AT } from '@blog/db/testing/tenants/fixtures';

import { isTenantWritable } from './is-tenant-writable';

describe(isTenantWritable, () => {
  it.each(WRITABLE_TENANT_STATUSES)('serves a %s tenant', (status) => {
    expect(isTenantWritable({ status, deprovisionedAt: null })).toBe(true);
  });

  it.each([TENANT_STATUS.SUSPENDED, TENANT_STATUS.ARCHIVED])(
    'does not serve a %s tenant',
    (status) => {
      expect(isTenantWritable({ status, deprovisionedAt: null })).toBe(false);
    },
  );

  it('does not serve a deprovisioned tenant whose status still reads ACTIVE', () => {
    expect(
      isTenantWritable({
        status: TENANT_STATUS.ACTIVE,
        deprovisionedAt: MOCK_DEPROVISIONED_AT,
      }),
    ).toBe(false);
  });
});
