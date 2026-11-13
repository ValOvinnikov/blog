import { ERROR_CODE } from '@blog/config';
import { queries } from '@blog/db';
import { errorResult, okResult } from '@blog/utils';
import {
  STRIPE_CUSTOMER_IDEMPOTENCY_PREFIX,
  STRIPE_ERROR_CODE,
  STRIPE_TENANT_METADATA_KEY,
} from '@platform/constants/billing';
import { MOCK_STRIPE_CUSTOMER_ID } from '@platform/testing/billing/fixtures';
import { mockStripeCheckoutClient } from '@platform/testing/billing/stripe-checkout-client';
import {
  MOCK_OWNER_EMAIL,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import Stripe from 'stripe';

import { ensureStripeCustomer } from './ensure-stripe-customer';

vi.mock('@blog/db', () => ({
  queries: {
    tenants: { setTenantBilling: vi.fn(async () => okResult({})) },
  },
}));

const { stripe, createCustomer, retrieveCustomer } = mockStripeCheckoutClient();

const MOCK_NEW_SITE = { id: MOCK_TENANT_ID, stripeCustomerId: null };
const MOCK_CUSTOMER_SITE = {
  id: MOCK_TENANT_ID,
  stripeCustomerId: MOCK_STRIPE_CUSTOMER_ID,
};

describe(ensureStripeCustomer, () => {
  it('creates one customer per site and stores it', async () => {
    const customerId = await ensureStripeCustomer(
      stripe,
      MOCK_NEW_SITE,
      MOCK_OWNER_EMAIL,
    );

    expect(customerId).toBe(MOCK_STRIPE_CUSTOMER_ID);
    expect(createCustomer).toHaveBeenCalledWith(
      {
        email: MOCK_OWNER_EMAIL,
        metadata: { [STRIPE_TENANT_METADATA_KEY]: MOCK_TENANT_ID },
      },
      {
        idempotencyKey: `${STRIPE_CUSTOMER_IDEMPOTENCY_PREFIX}${MOCK_TENANT_ID}`,
      },
    );
    expect(queries.tenants.setTenantBilling).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      { stripeCustomerId: MOCK_STRIPE_CUSTOMER_ID },
    );
  });

  it('fails when the new customer cannot be stored', async () => {
    vi.mocked(queries.tenants.setTenantBilling).mockResolvedValueOnce(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );

    await expect(
      ensureStripeCustomer(stripe, MOCK_NEW_SITE, MOCK_OWNER_EMAIL),
    ).rejects.toThrow(MOCK_TENANT_ID);
  });

  it("reuses the site's stored customer", async () => {
    const customerId = await ensureStripeCustomer(
      stripe,
      MOCK_CUSTOMER_SITE,
      MOCK_OWNER_EMAIL,
    );

    expect(customerId).toBe(MOCK_STRIPE_CUSTOMER_ID);
    expect(createCustomer).not.toHaveBeenCalled();
  });

  it.each([
    [
      'deleted',
      () => retrieveCustomer.mockResolvedValueOnce({ deleted: true }),
    ],
    [
      'unknown to Stripe',
      () =>
        retrieveCustomer.mockRejectedValueOnce(
          new Stripe.errors.StripeInvalidRequestError({
            code: STRIPE_ERROR_CODE.RESOURCE_MISSING,
          }),
        ),
    ],
  ])('returns nothing for a stored customer that is %s', async (_, arrange) => {
    arrange();

    const customerId = await ensureStripeCustomer(
      stripe,
      MOCK_CUSTOMER_SITE,
      MOCK_OWNER_EMAIL,
    );

    expect(customerId).toBeUndefined();
  });
});
