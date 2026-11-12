import { STRIPE_EVENT_RECORD_OUTCOME, TENANT_PLAN } from '@blog/db/constants';
import { BILLING_LOG, STRIPE_EVENT_TYPE } from '@platform/constants/billing';
import { onTenantPlanChange } from '@platform/server/tenants/on-tenant-plan-change';
import {
  MOCK_STRIPE_EVENT_ID,
  MOCK_STRIPE_INVOICE_ID,
  MOCK_STRIPE_SUBSCRIPTION_ID,
  mockStripeEvent,
  mockStripeInvoice,
} from '@platform/testing/billing/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { after } from 'next/server';
import type Stripe from 'stripe';

import { handleStripeEvent } from './handle-stripe-event';
import { sendPaymentReceipt } from './send-payment-receipt';
import { syncStripeSubscription } from './sync-stripe-subscription';

const { recordStripeEventMock, afterWork } = vi.hoisted(() => ({
  recordStripeEventMock: vi.fn(),
  afterWork: [] as Promise<void>[],
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    stripeWebhookEvents: { recordStripeEvent: recordStripeEventMock },
  },
}));

vi.mock('next/server', () => ({
  after: vi.fn((callback: () => Promise<void>) => {
    afterWork.push(callback());
  }),
}));

vi.mock('./sync-stripe-subscription', () => ({
  syncStripeSubscription: vi.fn(),
}));
vi.mock('./send-payment-receipt', () => ({ sendPaymentReceipt: vi.fn() }));
vi.mock('@platform/server/tenants/on-tenant-plan-change', () => ({
  onTenantPlanChange: vi.fn(),
}));

const stripe = {} as Stripe;
const UPGRADE = {
  tenantId: MOCK_TENANT_ID,
  fromPlan: TENANT_PLAN.FREE,
  toPlan: TENANT_PLAN.GROWTH,
};

const invoicePaidEvent = () =>
  mockStripeEvent(STRIPE_EVENT_TYPE.INVOICE_PAID, mockStripeInvoice());

const handle = async (event: Stripe.Event) => {
  await handleStripeEvent(stripe, event);
  await Promise.all(afterWork.splice(0));
};

describe(handleStripeEvent, () => {
  beforeEach(() => {
    vi.mocked(syncStripeSubscription).mockReset().mockResolvedValue(UPGRADE);
    recordStripeEventMock
      .mockReset()
      .mockResolvedValue(STRIPE_EVENT_RECORD_OUTCOME.RECORDED);
    vi.mocked(sendPaymentReceipt).mockReset().mockResolvedValue(undefined);
    vi.mocked(onTenantPlanChange).mockReset().mockResolvedValue(undefined);
    vi.mocked(after).mockClear();
    vi.mocked(logger.error).mockReset();
  });

  describe('a paid invoice delivered for the first time', () => {
    beforeEach(async () => {
      await handle(invoicePaidEvent());
    });

    it('syncs its subscription, then records the event', () => {
      expect(syncStripeSubscription).toHaveBeenCalledWith(
        stripe,
        MOCK_STRIPE_SUBSCRIPTION_ID,
      );
      expect(recordStripeEventMock).toHaveBeenCalledWith(MOCK_STRIPE_EVENT_ID);
      expect(
        vi.mocked(syncStripeSubscription).mock.invocationCallOrder[0],
      ).toBeLessThan(recordStripeEventMock.mock.invocationCallOrder[0] ?? 0);
    });

    it('runs the shared plan-change step', () => {
      expect(onTenantPlanChange).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        TENANT_PLAN.FREE,
        TENANT_PLAN.GROWTH,
      );
    });

    it('sends one receipt', () => {
      expect(sendPaymentReceipt).toHaveBeenCalledOnce();
      expect(sendPaymentReceipt).toHaveBeenCalledWith(
        stripe,
        MOCK_STRIPE_INVOICE_ID,
        MOCK_TENANT_ID,
        TENANT_PLAN.GROWTH,
      );
    });
  });

  it('sends no receipt and no plan email for an event already handled', async () => {
    recordStripeEventMock.mockResolvedValue(
      STRIPE_EVENT_RECORD_OUTCOME.ALREADY_HANDLED,
    );

    await handle(invoicePaidEvent());

    expect(after).not.toHaveBeenCalled();
    expect(sendPaymentReceipt).not.toHaveBeenCalled();
  });

  it('runs no plan-change step when the plan stays the same', async () => {
    vi.mocked(syncStripeSubscription).mockResolvedValue({
      ...UPGRADE,
      fromPlan: TENANT_PLAN.GROWTH,
    });

    await handle(mockStripeEvent());

    expect(onTenantPlanChange).not.toHaveBeenCalled();
    expect(sendPaymentReceipt).not.toHaveBeenCalled();
  });

  it('records the event but follows up on nothing when no tenant was written', async () => {
    vi.mocked(syncStripeSubscription).mockResolvedValue(undefined);

    await handle(invoicePaidEvent());

    expect(recordStripeEventMock).toHaveBeenCalledWith(MOCK_STRIPE_EVENT_ID);
    expect(after).not.toHaveBeenCalled();
  });

  it('records nothing when the sync throws, so Stripe retries', async () => {
    vi.mocked(syncStripeSubscription).mockRejectedValue(new Error());

    await expect(handle(invoicePaidEvent())).rejects.toThrow();
    expect(recordStripeEventMock).not.toHaveBeenCalled();
  });

  it('ignores an event type it does not handle', async () => {
    await handle(mockStripeEvent('customer.created'));

    expect(syncStripeSubscription).not.toHaveBeenCalled();
    expect(recordStripeEventMock).not.toHaveBeenCalled();
  });

  it('logs a receipt that fails to send', async () => {
    vi.mocked(sendPaymentReceipt).mockRejectedValue(new Error());

    await handle(invoicePaidEvent());

    expect(logger.error).toHaveBeenCalledWith(
      BILLING_LOG.RECEIPT_FAILED,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
  });
});
