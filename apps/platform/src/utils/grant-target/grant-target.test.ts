import {
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { TENANT_PLAN } from '@shinefold/config/constants';

import { toGrantTarget } from './grant-target';

describe(toGrantTarget, () => {
  it('names the tenant a grant would go to when the viewer can grant', () => {
    const tenant = mockTenant({ plan: TENANT_PLAN.STARTER });

    expect(toGrantTarget(tenant, true)).toEqual({
      tenantId: MOCK_TENANT_ID,
      tenantName: MOCK_TENANT_NAME,
      plan: TENANT_PLAN.STARTER,
    });
  });

  it('names no target when the viewer cannot grant', () => {
    expect(toGrantTarget(mockTenant(), false)).toBeUndefined();
  });

  it('names no target for an archived tenant', () => {
    const tenant = mockTenant({ deprovisionedAt: MOCK_ARCHIVED_AT });

    expect(toGrantTarget(tenant, true)).toBeUndefined();
  });
});
