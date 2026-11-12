import { ERROR_CODE } from '@blog/config/constants';
import {
  STRIPE_PRICE_LOOKUP_KEY,
  TENANT_PLAN,
  TENANT_PLAN_WRITE_OUTCOME,
  TENANT_STATUS,
} from '@blog/db/constants';
import {
  BILLING_LOG,
  STRIPE_SUBSCRIPTION_STATUS,
} from '@platform/constants/billing';
import {
  MOCK_EMPTY_TENANT_BILLING,
  MOCK_STORED_PROMOTION_CODE,
  MOCK_STRIPE_CUSTOMER_ID,
  MOCK_STRIPE_PROMOTION_CODE,
  MOCK_STRIPE_SUBSCRIPTION_ID,
  mockStripeSubscription,
} from '@platform/testing/billing/fixtures';
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
} = vi.hoisted(() => ({
  getTenantByIdMock: vi.fn(),
  getTenantBillingMock: vi.fn(),
  setTenantPlanMock: vi.fn(),
  setTenantBillingMock: vi.fn(),
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

const retrieveMock = vi.fn();
const stripe = {
  subscriptions: { retrieve: retrieveMock },
} as unknown as Stripe;

const sync = () => syncStripeSubscription(stripe, MOCK_STRIPE_SUBSCRIPTION_ID);

const writtenBilling = () => setTenantBillingMock.mock.calls[0]?.[1];

describe(syncStripeSubscription, () => {
  beforeEach(() => {
    vi.mocked(resolveStripeTenant)
      .mockReset()
      .mockResolvedValue(MOCK_TENANT_ID);
    retrieveMock.mockReset().mockResolvedValue(
      mockStripeSubscription({
        lookupKeys: [
          STRIPE_PRICE_LOOKUP_KEY.GROWTH_MONTHLY,
          STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_2500,
        ],
        promotionCode: MOCK_STRIPE_PROMOTION_CODE,
      }),
    );
    getTenantByIdMock.mockReset().mockResolvedValue(mockTenant());
    getTenantBillingMock
      .mockReset()
      .mockResolvedValue(MOCK_EMPTY_TENANT_BILLING);
    setTenantPlanMock.mockReset().mockResolvedValue({
      outcome: TENANT_PLAN_WRITE_OUTCOME.WRITTEN,
    });
    setTenantBillingMock.mockReset().mockResolvedValue({ ok: true });
    vi.mocked(logger.error).mockReset();
    vi.mocked(logger.warn).mockReset();
  });

  describe('an active Growth subscription', () => {
    let result: Awaited<ReturnType<typeof sync>>;

    beforeEach(async () => {
      result = await sync();
    });

    it('moves the tenant to Growth ACTIVE', () => {
      expect(setTenantPlanMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
        plan: TENANT_PLAN.GROWTH,
        status: TENANT_STATUS.ACTIVE,
      });
    });

    it('stores the Stripe ids, the promotion code and the band, ending any grace', () => {
      expect(writtenBilling()).toEqual({
        stripeCustomerId: MOCK_STRIPE_CUSTOMER_ID,
        stripeSubscriptionId: MOCK_STRIPE_SUBSCRIPTION_ID,
        stripePromotionCode: MOCK_STRIPE_PROMOTION_CODE,
        subscriberBandCeiling: 2_500,
        downgradeGraceStartedAt: null,
        graceStartedEmailSentAt: null,
        graceHalfwayEmailSentAt: null,
        graceEndingEmailSentAt: null,
      });
    });

    it('reports the plan it moved from and to', () => {
      expect(result).toEqual({
        tenantId: MOCK_TENANT_ID,
        fromPlan: TENANT_PLAN.FREE,
        toPlan: TENANT_PLAN.GROWTH,
      });
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

  it('moves a cancelled subscription to Free and starts the grace', async () => {
    retrieveMock.mockResolvedValue(
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

  it('writes nothing for a price it does not know', async () => {
    retrieveMock.mockResolvedValue(
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
    retrieveMock.mockResolvedValue(
      mockStripeSubscription({ status: 'incomplete' }),
    );

    expect(await sync()).toBeUndefined();
    expect(setTenantPlanMock).not.toHaveBeenCalled();
  });

  it('writes nothing when no tenant resolves', async () => {
    vi.mocked(resolveStripeTenant).mockResolvedValue(undefined);

    expect(await sync()).toBeUndefined();
    expect(setTenantPlanMock).not.toHaveBeenCalled();
  });

  it('logs and stores no billing for an archived or suspended tenant', async () => {
    setTenantPlanMock.mockResolvedValue({
      outcome: TENANT_PLAN_WRITE_OUTCOME.NOT_WRITABLE,
      status: TENANT_STATUS.SUSPENDED,
    });

    expect(await sync()).toBeUndefined();
    expect(setTenantBillingMock).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(BILLING_LOG.TENANT_NOT_WRITABLE, {
      tenantId: MOCK_TENANT_ID,
      subscriptionId: MOCK_STRIPE_SUBSCRIPTION_ID,
      outcome: TENANT_PLAN_WRITE_OUTCOME.NOT_WRITABLE,
    });
  });

  it('throws when the billing write fails, so Stripe retries', async () => {
    setTenantBillingMock.mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_NOT_FOUND,
    });

    await expect(sync()).rejects.toThrow();
  });
});
