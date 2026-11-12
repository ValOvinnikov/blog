import { STRIPE_TENANT_LOOKUP_OUTCOME } from '@blog/db/constants';
import { BILLING_LOG } from '@platform/constants/billing';
import {
  MOCK_STRIPE_CUSTOMER_ID,
  MOCK_STRIPE_SUBSCRIPTION_ID,
  mockStripeSubscription,
} from '@platform/testing/billing/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_ID,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';

import { resolveStripeTenant } from './resolve-stripe-tenant';

const { getTenantIdByStripeIdsMock, getTenantByIdMock } = vi.hoisted(() => ({
  getTenantIdByStripeIdsMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    tenants: {
      getTenantIdByStripeIds: getTenantIdByStripeIdsMock,
      getTenantById: getTenantByIdMock,
    },
  },
}));

const NOT_FOUND = { outcome: STRIPE_TENANT_LOOKUP_OUTCOME.NOT_FOUND };

describe(resolveStripeTenant, () => {
  beforeEach(() => {
    getTenantIdByStripeIdsMock.mockReset();
    getTenantByIdMock.mockReset().mockResolvedValue(mockTenant());
    vi.mocked(logger.error).mockReset();
  });

  it('finds the tenant by its stored Stripe ids', async () => {
    getTenantIdByStripeIdsMock.mockResolvedValue({
      outcome: STRIPE_TENANT_LOOKUP_OUTCOME.FOUND,
      tenantId: MOCK_TENANT_ID,
    });

    const tenantId = await resolveStripeTenant(
      mockStripeSubscription(),
      MOCK_STRIPE_CUSTOMER_ID,
    );

    expect(tenantId).toBe(MOCK_TENANT_ID);
    expect(getTenantIdByStripeIdsMock).toHaveBeenCalledWith({
      stripeCustomerId: MOCK_STRIPE_CUSTOMER_ID,
      stripeSubscriptionId: MOCK_STRIPE_SUBSCRIPTION_ID,
    });
  });

  it('logs a conflict and resolves no tenant', async () => {
    getTenantIdByStripeIdsMock.mockResolvedValue({
      outcome: STRIPE_TENANT_LOOKUP_OUTCOME.CONFLICT,
      customerTenantId: MOCK_TENANT_ID,
      subscriptionTenantId: MOCK_OTHER_TENANT_ID,
    });

    const tenantId = await resolveStripeTenant(
      mockStripeSubscription({ tenantId: MOCK_TENANT_ID }),
      MOCK_STRIPE_CUSTOMER_ID,
    );

    expect(tenantId).toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      BILLING_LOG.TENANT_CONFLICT,
      expect.objectContaining({ subscriptionTenantId: MOCK_OTHER_TENANT_ID }),
    );
  });

  describe('with no stored ids', () => {
    beforeEach(() => {
      getTenantIdByStripeIdsMock.mockResolvedValue(NOT_FOUND);
    });

    it("falls back to the subscription's tenant metadata", async () => {
      const tenantId = await resolveStripeTenant(
        mockStripeSubscription({ tenantId: MOCK_TENANT_ID }),
        MOCK_STRIPE_CUSTOMER_ID,
      );

      expect(tenantId).toBe(MOCK_TENANT_ID);
      expect(getTenantByIdMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    });

    it('logs and resolves no tenant without metadata', async () => {
      const tenantId = await resolveStripeTenant(
        mockStripeSubscription(),
        MOCK_STRIPE_CUSTOMER_ID,
      );

      expect(tenantId).toBeUndefined();
      expect(getTenantByIdMock).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(BILLING_LOG.TENANT_NOT_FOUND, {
        subscriptionId: MOCK_STRIPE_SUBSCRIPTION_ID,
      });
    });

    it('never queries a metadata value that is not a tenant id', async () => {
      await resolveStripeTenant(
        mockStripeSubscription({ tenantId: MOCK_STRIPE_CUSTOMER_ID }),
        MOCK_STRIPE_CUSTOMER_ID,
      );

      expect(getTenantByIdMock).not.toHaveBeenCalled();
    });

    it('resolves no tenant when the metadata names a missing tenant', async () => {
      getTenantByIdMock.mockResolvedValue(undefined);

      const tenantId = await resolveStripeTenant(
        mockStripeSubscription({ tenantId: MOCK_TENANT_ID }),
        MOCK_STRIPE_CUSTOMER_ID,
      );

      expect(tenantId).toBeUndefined();
    });
  });
});
