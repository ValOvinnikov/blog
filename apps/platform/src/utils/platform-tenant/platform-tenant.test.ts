import { TENANT_PLAN } from '@blog/db/constants';
import {
  MOCK_TENANT_CREATED_AT,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import {
  MOCK_TRIAL_ENDS_AT,
  mockTrialTenant,
} from '@platform/testing/tenants/mock-tenant';

import { toPlatformTenant } from './platform-tenant';

describe(toPlatformTenant, () => {
  it('adds a running trial to a trial site', () => {
    const { trial } = toPlatformTenant(
      mockTrialTenant(),
      MOCK_TENANT_CREATED_AT,
    );

    expect(trial).toEqual({
      plan: TENANT_PLAN.GROWTH,
      endsAt: MOCK_TRIAL_ENDS_AT,
      hasEnded: false,
    });
  });

  it('marks a trial past its end as ended', () => {
    const { trial } = toPlatformTenant(mockTrialTenant(), MOCK_TRIAL_ENDS_AT);

    expect(trial?.hasEnded).toBe(true);
  });

  it('adds no trial to a site that is not on one', () => {
    const { trial } = toPlatformTenant(mockTenant(), MOCK_TENANT_CREATED_AT);

    expect(trial).toBeUndefined();
  });
});
