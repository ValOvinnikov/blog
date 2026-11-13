import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  STRIPE_CUSTOMER_IDEMPOTENCY_PREFIX,
  STRIPE_ERROR_CODE,
  STRIPE_TENANT_METADATA_KEY,
} from '@platform/constants/billing';
import Stripe from 'stripe';

const isExistingCustomer = async (
  stripe: Stripe,
  customerId: string,
): Promise<boolean> => {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return !customer.deleted;
  } catch (error) {
    if (
      error instanceof Stripe.errors.StripeError &&
      error.code === STRIPE_ERROR_CODE.RESOURCE_MISSING
    ) {
      return false;
    }
    throw error;
  }
};

// The idempotency key makes two tabs racing for a site's first checkout get the same customer.
export const ensureStripeCustomer = async (
  stripe: Stripe,
  { id: tenantId, stripeCustomerId }: Pick<TTenant, 'id' | 'stripeCustomerId'>,
  email: TMaybeUndefined<string>,
): Promise<TMaybeUndefined<string>> => {
  if (stripeCustomerId) {
    return (await isExistingCustomer(stripe, stripeCustomerId))
      ? stripeCustomerId
      : undefined;
  }

  const { id } = await stripe.customers.create(
    { email, metadata: { [STRIPE_TENANT_METADATA_KEY]: tenantId } },
    { idempotencyKey: `${STRIPE_CUSTOMER_IDEMPOTENCY_PREFIX}${tenantId}` },
  );
  const write = await queries.tenants.setTenantBilling(tenantId, {
    stripeCustomerId: id,
  });
  if (!write.ok) {
    throw new Error(
      `ensureStripeCustomer: storing the customer of tenant "${tenantId}" failed.`,
    );
  }
  return id;
};
