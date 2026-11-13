import { TENANT_PLAN } from '@blog/config/constants';
import {
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_CREATED_AT,
  MOCK_TENANT_URL,
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

describe('the archived state', () => {
  it('reads a deprovisioned site as archived since its deprovisioning', () => {
    const { isArchived, archivedAt } = toPlatformTenant(
      mockTenant({ deprovisionedAt: MOCK_ARCHIVED_AT }),
    );

    expect(isArchived).toBe(true);
    expect(archivedAt).toBe(MOCK_ARCHIVED_AT);
  });

  it('reads a live site as not archived', () => {
    const { isArchived, archivedAt } = toPlatformTenant(mockTenant());

    expect(isArchived).toBe(false);
    expect(archivedAt).toBeUndefined();
  });
});

describe('the site address', () => {
  it('opens the site at its main address', () => {
    const { siteUrl } = toPlatformTenant(mockTenant());

    expect(siteUrl).toBe(MOCK_TENANT_URL);
  });
});

describe('the plan facts', () => {
  it('gives a Free site no custom domain and no Leads page', () => {
    const { entitlements, pageAccess } = toPlatformTenant(
      mockTenant({ plan: TENANT_PLAN.FREE }),
    );

    expect(entitlements.hasCustomDomain).toBe(false);
    expect(pageAccess.leads).toBe(false);
  });

  it('gives a Growth site its own sign-in apps and the Leads page', () => {
    const { entitlements, pageAccess } = toPlatformTenant(
      mockTenant({ plan: TENANT_PLAN.GROWTH }),
    );

    expect(entitlements.hasOwnOAuthApps).toBe(true);
    expect(pageAccess.leads).toBe(true);
  });
});
