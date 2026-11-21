import { MOCK_STRIPE_SUBSCRIPTION_ID } from '@platform/testing/billing/fixtures';
import {
  mockMembership,
  mockMembershipContext,
} from '@platform/testing/memberships/fixtures';
import {
  MOCK_TENANT_ID,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';
import { TENANT_PLAN } from '@shinefold/config/constants';

export const mockPayingSiteContext = (
  tenant: Parameters<typeof mockReadyTenant>[0] = {},
  membership = mockMembership(),
) =>
  mockMembershipContext(
    mockReadyTenant({
      id: MOCK_TENANT_ID,
      plan: TENANT_PLAN.STARTER,
      stripeSubscriptionId: MOCK_STRIPE_SUBSCRIPTION_ID,
      ...tenant,
    }),
    membership,
  );
