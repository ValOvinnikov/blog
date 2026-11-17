import {
  BILLING_LOG,
  STRIPE_SUBSCRIPTION_STATUS,
} from '@platform/constants/billing';
import {
  SUBSCRIPTION_LIFECYCLE_LOG,
  STRIPE_PAUSE_BEHAVIOR,
  STRIPE_UNSET_PARAM,
} from '@platform/constants/subscription-lifecycle';
import {
  MOCK_STRIPE_CUSTOMER_ID,
  MOCK_STRIPE_SUBSCRIPTION_ID,
} from '@platform/testing/billing/fixtures';
import { stripeCall } from '@platform/testing/billing/stripe-call';
import { MOCK_NETWORK_ERROR } from '@platform/testing/http/network-error';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { MOCK_TENANT_ID, mockTenant } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { ERROR_CODE, TENANT_PLAN } from '@shinefold/config/constants';
import { errorResult, okResult } from '@shinefold/utils';
import Stripe from 'stripe';

import { getStripeClient } from './stripe-client';
import {
  cancelLiveSubscription,
  setSubscriptionCollectionPaused,
} from './tenant-subscription-lifecycle';

vi.mock('./stripe-client');
const { setCancelledTenantFreeMock } = vi.hoisted(() => ({
  setCancelledTenantFreeMock: vi.fn(),
}));

vi.mock('@shinefold/db', async () => ({
  ...(await mockDbConstants()),
  queries: { tenants: { setCancelledTenantFree: setCancelledTenantFreeMock } },
}));

const MOCK_ALREADY_CANCELLED = new Stripe.errors.StripeInvalidRequestError({
  message: STRIPE_SUBSCRIPTION_STATUS.CANCELED,
});

const payingTenant = mockTenant({
  plan: TENANT_PLAN.GROWTH,
  stripeCustomerId: MOCK_STRIPE_CUSTOMER_ID,
  stripeSubscriptionId: MOCK_STRIPE_SUBSCRIPTION_ID,
});

const mockLifecycleStripe = (
  status: string = STRIPE_SUBSCRIPTION_STATUS.ACTIVE,
) => {
  const calls = {
    update: stripeCall({}),
    cancel: stripeCall({}),
    retrieve: stripeCall({ status }),
  };
  vi.mocked(getStripeClient).mockReturnValue({
    subscriptions: calls,
  } as unknown as Stripe);
  return calls;
};

let stripe: ReturnType<typeof mockLifecycleStripe>;

beforeEach(() => {
  stripe = mockLifecycleStripe();
  setCancelledTenantFreeMock.mockReset().mockResolvedValue(okResult());
});

describe(setSubscriptionCollectionPaused, () => {
  it('voids the invoices of a paying site while it is paused', async () => {
    await setSubscriptionCollectionPaused(payingTenant, true);

    expect(stripe.update).toHaveBeenCalledWith(MOCK_STRIPE_SUBSCRIPTION_ID, {
      pause_collection: { behavior: STRIPE_PAUSE_BEHAVIOR.VOID },
    });
  });

  it('clears the pause when collection resumes', async () => {
    await setSubscriptionCollectionPaused(payingTenant, false);

    expect(stripe.update).toHaveBeenCalledWith(MOCK_STRIPE_SUBSCRIPTION_ID, {
      pause_collection: STRIPE_UNSET_PARAM,
    });
  });

  it('leaves a site on Free alone, though Stripe kept its old subscription id', async () => {
    await setSubscriptionCollectionPaused(
      { ...payingTenant, plan: TENANT_PLAN.FREE },
      true,
    );

    expect(stripe.update).not.toHaveBeenCalled();
  });

  it('logs a failed update without throwing', async () => {
    stripe.update.mockRejectedValueOnce(MOCK_NETWORK_ERROR);

    await setSubscriptionCollectionPaused(payingTenant, true);

    expect(logger.error).toHaveBeenCalledWith(
      SUBSCRIPTION_LIFECYCLE_LOG.COLLECTION_FAILED,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID, isPaused: true }),
    );
  });

  it('logs a missing Stripe key', async () => {
    vi.mocked(getStripeClient).mockReturnValue(undefined);

    await setSubscriptionCollectionPaused(payingTenant, true);

    expect(logger.error).toHaveBeenCalledWith(BILLING_LOG.STRIPE_UNCONFIGURED, {
      tenantId: MOCK_TENANT_ID,
    });
  });
});

describe(cancelLiveSubscription, () => {
  it('cancels at once without proration, then moves the site to Free', async () => {
    await expect(cancelLiveSubscription(payingTenant)).resolves.toBe(true);

    expect(stripe.cancel).toHaveBeenCalledWith(MOCK_STRIPE_SUBSCRIPTION_ID, {
      prorate: false,
    });
    expect(setCancelledTenantFreeMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_STRIPE_SUBSCRIPTION_ID,
    );
  });

  it('succeeds without Stripe for a site with no live subscription', async () => {
    await expect(cancelLiveSubscription(mockTenant())).resolves.toBe(true);
    expect(stripe.cancel).not.toHaveBeenCalled();
  });

  describe('when Stripe refuses the cancel', () => {
    beforeEach(() => {
      stripe.cancel.mockRejectedValueOnce(MOCK_ALREADY_CANCELLED);
    });

    it('treats a subscription Stripe already cancelled as cancelled', async () => {
      stripe.retrieve.mockResolvedValueOnce({
        status: STRIPE_SUBSCRIPTION_STATUS.CANCELED,
      });

      await expect(cancelLiveSubscription(payingTenant)).resolves.toBe(true);
      expect(setCancelledTenantFreeMock).toHaveBeenCalled();
    });

    it('fails and logs when the subscription is still live', async () => {
      await expect(cancelLiveSubscription(payingTenant)).resolves.toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        SUBSCRIPTION_LIFECYCLE_LOG.CANCEL_FAILED,
        expect.objectContaining({
          tenantId: MOCK_TENANT_ID,
          subscriptionId: MOCK_STRIPE_SUBSCRIPTION_ID,
        }),
      );
    });
  });

  it('fails when the Free write after the cancel throws', async () => {
    setCancelledTenantFreeMock.mockRejectedValueOnce(MOCK_NETWORK_ERROR);

    await expect(cancelLiveSubscription(payingTenant)).resolves.toBe(false);
  });

  it('fails and logs when the Free write matches no site', async () => {
    setCancelledTenantFreeMock.mockResolvedValueOnce(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );

    await expect(cancelLiveSubscription(payingTenant)).resolves.toBe(false);
    expect(logger.error).toHaveBeenCalledWith(
      SUBSCRIPTION_LIFECYCLE_LOG.CANCEL_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        subscriptionId: MOCK_STRIPE_SUBSCRIPTION_ID,
        errorCode: ERROR_CODE.DB_NOT_FOUND,
      },
    );
  });

  it('fails and logs when Stripe has no key', async () => {
    vi.mocked(getStripeClient).mockReturnValue(undefined);

    await expect(cancelLiveSubscription(payingTenant)).resolves.toBe(false);
    expect(logger.error).toHaveBeenCalledWith(BILLING_LOG.STRIPE_UNCONFIGURED, {
      tenantId: MOCK_TENANT_ID,
    });
  });
});
