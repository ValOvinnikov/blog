import { BILLING_LOG } from '@platform/constants/billing';
import { STRIPE_EVENT_TYPE } from '@platform/constants/stripe-event';
import {
  PAYMENT_FAILURE,
  STRIPE_BILLING_REASON,
} from '@platform/constants/stripe-payment';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { onTenantPlanChange } from '@platform/server/tenants/on-tenant-plan-change';
import {
  MOCK_GROWTH_UPGRADE,
  MOCK_STRIPE_CLIENT,
  MOCK_STRIPE_INVOICE_ID,
  MOCK_STRIPE_SUBSCRIPTION_ID,
  MOCK_UNHANDLED_EVENT_TYPE,
  mockStripeInvoice,
} from '@platform/testing/billing/fixtures';
import { MOCK_SCHEDULE_ID } from '@platform/testing/billing/plan-subscription';
import { mockStripePlanChangeClient } from '@platform/testing/billing/stripe-plan-change-client';
import {
  mockPendingUpdateClearedEvent,
  mockStripeEvent,
  mockStripeSubscription,
} from '@platform/testing/billing/stripe-subscription';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { TENANT_PLAN } from '@shinefold/config/constants';
import type { TValueOf } from '@shinefold/config/utils';
import { STRIPE_EVENT_RECORD_OUTCOME } from '@shinefold/db/constants';
import { MOCK_STRIPE_EVENT_ID } from '@shinefold/db/testing/tenants/billing';
import { after } from 'next/server';
import type Stripe from 'stripe';

import { handleCatalogueEvent } from './catalogue/handle-catalogue-event';
import { revalidatePlatformSite } from './catalogue/revalidate-platform-site';
import { handleStripeEvent } from './handle-stripe-event';
import { invoiceAwaitsAuthentication } from './invoice-awaits-authentication';
import { sendPaymentFailedNotice } from './send-payment-failed-notice';
import { sendPaymentReceipt } from './send-payment-receipt';
import { syncStripeSubscription } from './sync-stripe-subscription';

const { recordStripeEventMock, afterWork } = vi.hoisted(() => ({
  recordStripeEventMock: vi.fn(),
  afterWork: [] as Promise<void>[],
}));

vi.mock('@shinefold/db', async () => ({
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
vi.mock('./send-payment-failed-notice', () => ({
  sendPaymentFailedNotice: vi.fn(),
}));
vi.mock('./invoice-awaits-authentication', () => ({
  invoiceAwaitsAuthentication: vi.fn(),
}));
vi.mock('./catalogue/handle-catalogue-event', () => ({
  handleCatalogueEvent: vi.fn(),
}));
vi.mock('./catalogue/revalidate-platform-site', () => ({
  revalidatePlatformSite: vi.fn(),
}));
vi.mock('@platform/server/tenants/on-tenant-plan-change', () => ({
  onTenantPlanChange: vi.fn(),
}));
vi.mock('@platform/server/site-config/revalidate-site-config');

const invoicePaidEvent = () =>
  mockStripeEvent(STRIPE_EVENT_TYPE.INVOICE_PAID, mockStripeInvoice());

const MOCK_RETRY_ATTEMPT_COUNT = 2;

const paymentFailedEvent = ({
  type = STRIPE_EVENT_TYPE.INVOICE_PAYMENT_FAILED,
  attemptCount = 1,
  billingReason = STRIPE_BILLING_REASON.SUBSCRIPTION_CYCLE,
}: {
  type?:
    | typeof STRIPE_EVENT_TYPE.INVOICE_PAYMENT_FAILED
    | typeof STRIPE_EVENT_TYPE.INVOICE_PAYMENT_ACTION_REQUIRED;
  attemptCount?: number;
  billingReason?: TValueOf<typeof STRIPE_BILLING_REASON>;
} = {}) =>
  mockStripeEvent(
    type,
    mockStripeInvoice({
      attempt_count: attemptCount,
      billing_reason: billingReason,
    }),
  );

const paymentActionRequiredEvent = (attemptCount?: number) =>
  paymentFailedEvent({
    type: STRIPE_EVENT_TYPE.INVOICE_PAYMENT_ACTION_REQUIRED,
    attemptCount,
  });

const handle = async (event: Stripe.Event) => {
  await handleStripeEvent(MOCK_STRIPE_CLIENT, event);
  await Promise.all(afterWork.splice(0));
};

describe(handleStripeEvent, () => {
  beforeEach(() => {
    vi.mocked(syncStripeSubscription).mockResolvedValue(MOCK_GROWTH_UPGRADE);
    vi.mocked(handleCatalogueEvent).mockResolvedValue(false);
    recordStripeEventMock.mockResolvedValue(
      STRIPE_EVENT_RECORD_OUTCOME.RECORDED,
    );
  });

  describe('a paid invoice delivered for the first time', () => {
    beforeEach(async () => {
      await handle(invoicePaidEvent());
    });

    it('syncs its subscription, then records the event', () => {
      expect(syncStripeSubscription).toHaveBeenCalledWith(
        MOCK_STRIPE_CLIENT,
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

    it("purges the tenant's site config", () => {
      expect(revalidateSiteConfig).toHaveBeenCalledWith(MOCK_TENANT_ID);
    });

    it('sends one receipt', () => {
      expect(sendPaymentReceipt).toHaveBeenCalledOnce();
      expect(sendPaymentReceipt).toHaveBeenCalledWith(
        MOCK_STRIPE_CLIENT,
        MOCK_STRIPE_INVOICE_ID,
        MOCK_TENANT_ID,
        TENANT_PLAN.GROWTH,
      );
    });
  });

  describe('an event already recorded', () => {
    beforeEach(() => {
      recordStripeEventMock.mockResolvedValue(
        STRIPE_EVENT_RECORD_OUTCOME.ALREADY_HANDLED,
      );
    });

    it('sends no second receipt', async () => {
      await handle(invoicePaidEvent());

      expect(sendPaymentReceipt).not.toHaveBeenCalled();
    });

    it('still runs the plan-change step its own write made', async () => {
      await handle(mockStripeEvent());

      expect(onTenantPlanChange).toHaveBeenCalledOnce();
    });
  });

  it('runs no plan-change step when its write changed no plan', async () => {
    vi.mocked(syncStripeSubscription).mockResolvedValue({
      ...MOCK_GROWTH_UPGRADE,
      fromPlan: TENANT_PLAN.GROWTH,
    });

    await handle(mockStripeEvent());

    expect(onTenantPlanChange).not.toHaveBeenCalled();
    expect(revalidateSiteConfig).not.toHaveBeenCalled();
  });

  it('records the event but follows up on nothing when no tenant was written', async () => {
    vi.mocked(syncStripeSubscription).mockResolvedValue(undefined);

    await handle(invoicePaidEvent());

    expect(recordStripeEventMock).toHaveBeenCalledWith(MOCK_STRIPE_EVENT_ID);
    expect(after).not.toHaveBeenCalled();
  });

  it('releases the planned move when a held move up is applied', async () => {
    const { stripe, releaseSchedule } = mockStripePlanChangeClient(
      mockStripeSubscription(),
    );

    await handleStripeEvent(
      stripe,
      mockPendingUpdateClearedEvent({}, { isApplied: true }),
    );

    expect(releaseSchedule).toHaveBeenCalledExactlyOnceWith(MOCK_SCHEDULE_ID);
    expect(releaseSchedule).toHaveBeenCalledBefore(recordStripeEventMock);
  });

  it('records nothing when the sync throws, so Stripe retries', async () => {
    vi.mocked(syncStripeSubscription).mockRejectedValue(new Error());

    await expect(handle(invoicePaidEvent())).rejects.toThrow();
    expect(recordStripeEventMock).not.toHaveBeenCalled();
  });

  it('hands a catalogue event to the catalogue sync and refreshes the platform site', async () => {
    vi.mocked(handleCatalogueEvent).mockResolvedValue(true);

    await handle(mockStripeEvent(STRIPE_EVENT_TYPE.PRICE_UPDATED));

    expect(syncStripeSubscription).not.toHaveBeenCalled();
    expect(recordStripeEventMock).not.toHaveBeenCalled();
    expect(revalidatePlatformSite).toHaveBeenCalledOnce();
  });

  it('leaves the platform site alone after a subscription event', async () => {
    await handle(invoicePaidEvent());

    expect(revalidatePlatformSite).not.toHaveBeenCalled();
  });

  it('ignores an event type it does not handle', async () => {
    await handle(mockStripeEvent(MOCK_UNHANDLED_EVENT_TYPE));

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

  describe('a failed renewal payment', () => {
    beforeEach(() => {
      vi.mocked(invoiceAwaitsAuthentication).mockResolvedValue(false);
    });

    it("emails the owner once on a declined payment's first attempt", async () => {
      const event = paymentFailedEvent();

      await handle(event);

      expect(invoiceAwaitsAuthentication).toHaveBeenCalledWith(
        MOCK_STRIPE_CLIENT,
        MOCK_STRIPE_INVOICE_ID,
      );
      expect(sendPaymentFailedNotice).toHaveBeenCalledExactlyOnceWith(
        event.data.object,
        MOCK_TENANT_ID,
        TENANT_PLAN.GROWTH,
        PAYMENT_FAILURE.DECLINED,
      );
      expect(sendPaymentReceipt).not.toHaveBeenCalled();
    });

    it("asks the owner once to confirm a payment awaiting the bank's check", async () => {
      const event = paymentActionRequiredEvent();

      await handle(event);

      expect(sendPaymentFailedNotice).toHaveBeenCalledExactlyOnceWith(
        event.data.object,
        MOCK_TENANT_ID,
        TENANT_PLAN.GROWTH,
        PAYMENT_FAILURE.AUTHENTICATION_REQUIRED,
      );
    });

    it('sends one email when a bank-check payment is both failed and needing action', async () => {
      vi.mocked(invoiceAwaitsAuthentication).mockResolvedValue(true);

      await handle(paymentFailedEvent());
      await handle(paymentActionRequiredEvent());

      expect(sendPaymentFailedNotice).toHaveBeenCalledExactlyOnceWith(
        expect.anything(),
        MOCK_TENANT_ID,
        TENANT_PLAN.GROWTH,
        PAYMENT_FAILURE.AUTHENTICATION_REQUIRED,
      );
    });

    it("sends nothing for a later retry needing the bank's check", async () => {
      await handle(paymentActionRequiredEvent(MOCK_RETRY_ATTEMPT_COUNT));

      expect(sendPaymentFailedNotice).not.toHaveBeenCalled();
    });

    it('sends nothing for a later retry of the same invoice', async () => {
      await handle(
        paymentFailedEvent({ attemptCount: MOCK_RETRY_ATTEMPT_COUNT }),
      );

      expect(sendPaymentFailedNotice).not.toHaveBeenCalled();
    });

    it('sends nothing for a failed plan-change invoice', async () => {
      await handle(
        paymentFailedEvent({
          billingReason: STRIPE_BILLING_REASON.SUBSCRIPTION_UPDATE,
        }),
      );

      expect(sendPaymentFailedNotice).not.toHaveBeenCalled();
    });

    it('logs a failed send without failing the webhook', async () => {
      vi.mocked(invoiceAwaitsAuthentication).mockRejectedValue(new Error());

      await expect(handle(paymentFailedEvent())).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalledWith(
        BILLING_LOG.PAYMENT_FAILED_EMAIL_FAILED,
        expect.objectContaining({
          tenantId: MOCK_TENANT_ID,
          eventId: MOCK_STRIPE_EVENT_ID,
        }),
      );
    });
  });
});
