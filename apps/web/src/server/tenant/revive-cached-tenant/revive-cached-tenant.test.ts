import type { TMaybeJsonDates } from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';
import { mockServableTenant } from '@web/testing/server/tenant/fixtures';

import { reviveCachedTenant } from './revive-cached-tenant';

const MOCK_TENANT = mockServableTenant({ suspendedAt: new Date() });

describe(reviveCachedTenant, () => {
  it('restores the timestamps of a JSON round-tripped tenant', () => {
    const cached: TMaybeJsonDates<TTenant> = JSON.parse(
      JSON.stringify(MOCK_TENANT),
    );

    expect(reviveCachedTenant(cached)).toEqual(MOCK_TENANT);
  });

  it('leaves a tenant that never left memory as it was', () => {
    expect(reviveCachedTenant(MOCK_TENANT)).toEqual(MOCK_TENANT);
  });
});
