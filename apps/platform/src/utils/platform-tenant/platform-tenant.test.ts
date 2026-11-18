import {
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_CREATED_AT,
  MOCK_TENANT_URL,
  mockEntitlementGrant,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import {
  MOCK_TRIAL_ENDS_AT,
  mockTrialTenant,
} from '@platform/testing/tenants/mock-tenant';
import {
  CAPABILITY,
  MODULE_PACK,
  TENANT_PLAN,
} from '@shinefold/config/constants';
import { ENTITLEMENT_KIND } from '@shinefold/db/constants';

import { toPlatformTenant, toPlatformTenantSummary } from './platform-tenant';

describe(toPlatformTenantSummary, () => {
  it('adds a running trial to a trial site', () => {
    const { trial } = toPlatformTenantSummary(
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
    const { trial } = toPlatformTenantSummary(
      mockTrialTenant(),
      MOCK_TRIAL_ENDS_AT,
    );

    expect(trial?.hasEnded).toBe(true);
  });

  it('adds no trial to a site that is not on one', () => {
    const { trial } = toPlatformTenantSummary(
      mockTenant(),
      MOCK_TENANT_CREATED_AT,
    );

    expect(trial).toBeUndefined();
  });
});

describe('the archived state', () => {
  it('reads a deprovisioned site as archived since its deprovisioning', () => {
    const { isArchived, archivedAt } = toPlatformTenantSummary(
      mockTenant({ deprovisionedAt: MOCK_ARCHIVED_AT }),
    );

    expect(isArchived).toBe(true);
    expect(archivedAt).toBe(MOCK_ARCHIVED_AT);
  });

  it('reads a live site as not archived', () => {
    const { isArchived, archivedAt } = toPlatformTenantSummary(mockTenant());

    expect(isArchived).toBe(false);
    expect(archivedAt).toBeUndefined();
  });
});

describe('the site address', () => {
  it('opens the site at its main address', () => {
    const { siteUrl } = toPlatformTenantSummary(mockTenant());

    expect(siteUrl).toBe(MOCK_TENANT_URL);
  });
});

describe(toPlatformTenant, () => {
  it('gives a Free site no custom domain and no Leads page', () => {
    const { entitlements, pageAccess } = toPlatformTenant(
      mockTenant({ plan: TENANT_PLAN.FREE }),
      [],
    );

    expect(entitlements.hasCustomDomain).toBe(false);
    expect(pageAccess.leads).toBe(false);
  });

  it('gives a Growth site its own sign-in apps and the Leads page', () => {
    const { entitlements, pageAccess } = toPlatformTenant(
      mockTenant({ plan: TENANT_PLAN.GROWTH }),
      [],
    );

    expect(entitlements.hasOwnOAuthApps).toBe(true);
    expect(pageAccess.leads).toBe(true);
  });

  it('opens the Leads page on a Free site granted the contact form', () => {
    const { entitlements, pageAccess } = toPlatformTenant(
      mockTenant({ plan: TENANT_PLAN.FREE }),
      [mockEntitlementGrant({ key: CAPABILITY.CONTACT_FORM })],
    );

    expect(entitlements.capabilities).toContain(CAPABILITY.CONTACT_FORM);
    expect(pageAccess.leads).toBe(true);
  });

  it('adds a granted module pack', () => {
    const { entitlements } = toPlatformTenant(
      mockTenant({ plan: TENANT_PLAN.FREE }),
      [
        mockEntitlementGrant({
          kind: ENTITLEMENT_KIND.MODULE_PACK,
          key: MODULE_PACK.GROWTH,
        }),
      ],
    );

    expect(entitlements.modulePacks).toContain(MODULE_PACK.GROWTH);
  });

  it('ignores a grant that expired before now', () => {
    const { pageAccess } = toPlatformTenant(
      mockTenant({ plan: TENANT_PLAN.FREE }),
      [mockEntitlementGrant({ expiresAt: MOCK_TENANT_CREATED_AT })],
      MOCK_TRIAL_ENDS_AT,
    );

    expect(pageAccess.leads).toBe(false);
  });
});
