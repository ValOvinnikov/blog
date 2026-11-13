import {
  ERROR_CODE,
  TENANT_PLAN,
  type TTenantPlan,
} from '@blog/config/constants';
import {
  STRIPE_PRICE_LOOKUP_KEY,
  TENANT_PLAN_WRITE_OUTCOME,
  TENANT_STATUS,
} from '@blog/db/constants';
import { MOCK_EMPTY_TENANT_BILLING } from '@blog/db/testing/tenants/billing';
import {
  BILLING_LOG,
  STRIPE_SUBSCRIPTION_STATUS,
} from '@platform/constants/billing';
import {
  MOCK_BAND_CEILING,
  MOCK_INCOMPLETE_SUBSCRIPTION_STATUS,
  MOCK_OTHER_STRIPE_SUBSCRIPTION_ID,
  MOCK_STORED_PROMOTION_CODE,
  MOCK_STRIPE_CUSTOMER_ID,
  MOCK_STRIPE_PROMOTION_CODE,
  MOCK_STRIPE_SUBSCRIPTION_ID,
} from '@platform/testing/billing/fixtures';
import { mockStripeSubscription } from '@platform/testing/billing/stripe-subscription';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { MOCK_TENANT_ID, mockTenant } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import type Stripe from 'stripe';

import { resolveStripeTenant } from './resolve-stripe-tenant';
import { syncStripeSubscription } from './sync-stripe-subscription';

const {
  getTenantByIdMock,
  getTenantBillingMock,
  setTenantPlanMock,
  setTenantBillingMock,
  retrieveSubscriptionMock,
} = vi.hoisted(() => ({
  getTenantByIdMock: vi.fn(),
  getTenantBillingMock: vi.fn(),
  setTenantPlanMock: vi.fn(),
  setTenantBillingMock: vi.fn(),
  retrieveSubscriptionMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    tenants: {
      getTenantById: getTenantByIdMock,
      getTenantBilling: getTenantBillingMock,
      setTenantPlan: setTenantPlanMock,
      setTenantBilling: setTenantBillingMock,
    },
  },
}));

vi.mock('./resolve-stripe-tenant', () => ({ resolveStripeTenant: vi.fn() }));

const MOCK_STRIPE = {
  subscriptions: { retrieve: retrieveSubscriptionMock },
} as unknown as Stripe;

const sync = () =>
  syncStripeSubscription(MOCK_STRIPE, MOCK_STRIPE_SUBSCRIPTION_ID);

const writtenBilling = () => setTenantBillingMock.mock.calls[0]?.[1];

const writtenPlan = (previousPlan: TTenantPlan = TENANT_PLAN.FREE) => ({
  outcome: TENANT_PLAN_WRITE_OUTCOME.WRITTEN,
  plan: TENANT_PLAN.GROWTH,
  status: TENANT_STATUS.ACTIVE,
  previousPlan,
});

describe(syncStripeSubscription, () => {
  beforeEach(() => {
    vi.mocked(resolveStripeTenant).mockResolvedValue(MOCK_TENANT_ID);
    retrieveSubscriptionMock.mockResolvedValue(
      mockStripeSubscription({
        lookupKeys: [
          STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY,
          STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_2500,
        ],
        promotionCode: MOCK_STRIPE_PROMOTION_CODE,
      }),
    );
    getTenantByIdMock.mockResolvedValue(mockTenant());
    getTenantBillingMock.mockResolvedValue(MOCK_EMPTY_TENANT_BILLING);
    setTenantPlanMock.mockResolvedValue(writtenPlan());
    setTenantBillingMock.mockResolvedValue({ ok: true });
  });

  describe('an active Growth subscription', () => {
    let result: Awaited<ReturnType<typeof sync>>;

    beforeEach(async () => {
      result = await sync();
    });

    it('moves the tenant to Growth ACTIVE after storing its billing', () => {
      expect(setTenantPlanMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
        plan: TENANT_PLAN.GROWTH,
        status: TENANT_STATUS.ACTIVE,
      });
      expect(setTenantBillingMock.mock.invocationCallOrder[0]).toBeLessThan(
        setTenantPlanMock.mock.invocationCallOrder[0] ?? 0,
      );
    });

    it('stores the Stripe ids, the promotion code and the band, ending any grace', () => {
      expect(writtenBilling()).toEqual({
        stripeCustomerId: MOCK_STRIPE_CUSTOMER_ID,
        stripeSubscriptionId: MOCK_STRIPE_SUBSCRIPTION_ID,
        stripePromotionCode: MOCK_STRIPE_PROMOTION_CODE,
        subscriberBandCeiling: MOCK_BAND_CEILING,
        downgradeGraceStartedAt: null,
        graceStartedEmailSentAt: null,
        graceHalfwayEmailSentAt: null,
        graceEndingEmailSentAt: null,
      });
    });

    it('reports the plan change the write made', () => {
      expect(result).toEqual({
        tenantId: MOCK_TENANT_ID,
        fromPlan: TENANT_PLAN.FREE,
        toPlan: TENANT_PLAN.GROWTH,
      });
    });
  });

  it('reports no change when the write found the plan already set', async () => {
    setTenantPlanMock.mockResolvedValue(writtenPlan(TENANT_PLAN.GROWTH));

    expect(await sync()).toMatchObject({
      fromPlan: TENANT_PLAN.GROWTH,
      toPlan: TENANT_PLAN.GROWTH,
    });
  });

  it('keeps the promotion code the subscription started with', async () => {
    getTenantBillingMock.mockResolvedValue({
      ...MOCK_EMPTY_TENANT_BILLING,
      stripePromotionCode: MOCK_STORED_PROMOTION_CODE,
    });

    await sync();

    expect(writtenBilling()?.stripePromotionCode).toBe(
      MOCK_STORED_PROMOTION_CODE,
    );
  });

  it('moves a cancelled paid site to Free and starts the grace', async () => {
    getTenantByIdMock.mockResolvedValue(
      mockTenant({ plan: TENANT_PLAN.GROWTH }),
    );
    retrieveSubscriptionMock.mockResolvedValue(
      mockStripeSubscription({ status: STRIPE_SUBSCRIPTION_STATUS.CANCELED }),
    );

    await sync();

    expect(setTenantPlanMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    });
    expect(writtenBilling()).toMatchObject({
      subscriberBandCeiling: null,
      downgradeGraceStartedAt: expect.any(Date),
    });
  });

  it('starts no grace for a cancelled subscription on a site already on Free', async () => {
    retrieveSubscriptionMock.mockResolvedValue(
      mockStripeSubscription({ status: STRIPE_SUBSCRIPTION_STATUS.CANCELED }),
    );

    await sync();

    expect(writtenBilling()).not.toHaveProperty('downgradeGraceStartedAt');
  });

  describe('when the tenant stores a different subscription', () => {
    beforeEach(() => {
      getTenantBillingMock.mockResolvedValue({
        ...MOCK_EMPTY_TENANT_BILLING,
        stripeSubscriptionId: MOCK_OTHER_STRIPE_SUBSCRIPTION_ID,
      });
    });

    it('ignores and logs a late event for an ended subscription', async () => {
      retrieveSubscriptionMock.mockResolvedValue(
        mockStripeSubscription({ status: STRIPE_SUBSCRIPTION_STATUS.CANCELED }),
      );

      expect(await sync()).toBeUndefined();
      expect(setTenantBillingMock).not.toHaveBeenCalled();
      expect(setTenantPlanMock).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        BILLING_LOG.SUBSCRIPTION_SUPERSEDED,
        {
          tenantId: MOCK_TENANT_ID,
          subscriptionId: MOCK_STRIPE_SUBSCRIPTION_ID,
          storedSubscriptionId: MOCK_OTHER_STRIPE_SUBSCRIPTION_ID,
        },
      );
    });

    it('adopts a new live subscription', async () => {
      await sync();

      expect(writtenBilling()?.stripeSubscriptionId).toBe(
        MOCK_STRIPE_SUBSCRIPTION_ID,
      );
    });
  });

  it('writes nothing for a price it does not know', async () => {
    retrieveSubscriptionMock.mockResolvedValue(
      mockStripeSubscription({
        lookupKeys: [STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_2500],
      }),
    );

    expect(await sync()).toBeUndefined();
    expect(setTenantPlanMock).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(BILLING_LOG.PRICE_UNKNOWN, {
      tenantId: MOCK_TENANT_ID,
      subscriptionId: MOCK_STRIPE_SUBSCRIPTION_ID,
    });
  });

  it('writes nothing while the subscription is incomplete', async () => {
    retrieveSubscriptionMock.mockResolvedValue(
      mockStripeSubscription({ status: MOCK_INCOMPLETE_SUBSCRIPTION_STATUS }),
    );

    expect(await sync()).toBeUndefined();
    expect(setTenantBillingMock).not.toHaveBeenCalled();
  });

  it('writes nothing when no tenant resolves', async () => {
    vi.mocked(resolveStripeTenant).mockResolvedValue(undefined);

    expect(await sync()).toBeUndefined();
    expect(setTenantPlanMock).not.toHaveBeenCalled();
  });

  it.each([TENANT_STATUS.ARCHIVED, TENANT_STATUS.SUSPENDED])(
    'logs and writes nothing for a %s tenant',
    async (status) => {
      getTenantByIdMock.mockResolvedValue(mockTenant({ status }));

      expect(await sync()).toBeUndefined();
      expect(setTenantBillingMock).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        BILLING_LOG.TENANT_NOT_WRITABLE,
        {
          tenantId: MOCK_TENANT_ID,
          subscriptionId: MOCK_STRIPE_SUBSCRIPTION_ID,
          status,
        },
      );
    },
  );

  it('reports nothing when the plan write finds the tenant no longer writable', async () => {
    setTenantPlanMock.mockResolvedValue({
      outcome: TENANT_PLAN_WRITE_OUTCOME.NOT_WRITABLE,
      status: TENANT_STATUS.SUSPENDED,
    });

    expect(await sync()).toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith(BILLING_LOG.TENANT_NOT_WRITABLE, {
      tenantId: MOCK_TENANT_ID,
      subscriptionId: MOCK_STRIPE_SUBSCRIPTION_ID,
      status: TENANT_STATUS.ACTIVE,
    });
  });

  it('throws before the plan write when the billing write fails, so Stripe retries', async () => {
    setTenantBillingMock.mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_NOT_FOUND,
    });

    await expect(sync()).rejects.toThrow();
    expect(setTenantPlanMock).not.toHaveBeenCalled();
  });
});
