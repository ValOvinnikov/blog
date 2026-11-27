import { MOCK_STRIPE_SUBSCRIPTION_ID } from '@platform/testing/billing/fixtures';
import {
  mockMembership,
  mockViewer,
} from '@platform/testing/memberships/fixtures';
import {
  MOCK_TENANT_CREATED_AT,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { TENANT_PLAN } from '@shinefold/config/constants';
import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';

import { canOfferUpgrade } from './can-offer-upgrade';

const MOCK_OWNER = mockViewer();
const MOCK_EDITOR = mockViewer({
  membership: mockMembership({ role: MEMBERSHIP_ROLE.EDITOR }),
});
const MOCK_SUBSCRIBED_TENANT = mockTenant({
  plan: TENANT_PLAN.STARTER,
  stripeSubscriptionId: MOCK_STRIPE_SUBSCRIPTION_ID,
});

describe(canOfferUpgrade, () => {
  it.each([
    ['the owner of a Free site', mockTenant(), MOCK_OWNER, true],
    [
      'the owner of a subscribed site',
      MOCK_SUBSCRIBED_TENANT,
      MOCK_OWNER,
      true,
    ],
    ['an editor of a Free site', mockTenant(), MOCK_EDITOR, false],
    [
      'an editor of a subscribed site',
      MOCK_SUBSCRIBED_TENANT,
      MOCK_EDITOR,
      false,
    ],
  ])('offers an upgrade to %s: %s', (_label, tenant, viewer, isOffered) => {
    expect(canOfferUpgrade(tenant, viewer)).toBe(isOffered);
  });

  it('offers no upgrade on a deprovisioned site', () => {
    const tenant = mockTenant({ deprovisionedAt: MOCK_TENANT_CREATED_AT });

    expect(canOfferUpgrade(tenant, MOCK_OWNER)).toBe(false);
  });
});
