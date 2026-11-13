import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  BILLING_LOG,
  STRIPE_CUSTOMER_IDEMPOTENCY_PREFIX,
  STRIPE_ERROR_CODE,
  STRIPE_TENANT_METADATA_KEY,
} from '@platform/constants/billing';
import { logger } from '@platform/utils/logger/logger';
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

const createSiteCustomer = async (
  stripe: Stripe,
  tenantId: string,
  email: TMaybeUndefined<string>,
  idempotencyKey: string,
): Promise<string> => {
  const { id } = await stripe.customers.create(
    { email, metadata: { [STRIPE_TENANT_METADATA_KEY]: tenantId } },
    { idempotencyKey },
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

// The idempotency key makes two tabs racing for a site's first checkout get the same customer; a replacement keys on the customer it replaces.
export const ensureStripeCustomer = async (
  stripe: Stripe,
  { id: tenantId, stripeCustomerId }: Pick<TTenant, 'id' | 'stripeCustomerId'>,
  email: TMaybeUndefined<string>,
): Promise<string> => {
  const idempotencyKey = `${STRIPE_CUSTOMER_IDEMPOTENCY_PREFIX}${tenantId}`;
  if (!stripeCustomerId) {
    return createSiteCustomer(stripe, tenantId, email, idempotencyKey);
  }
  if (await isExistingCustomer(stripe, stripeCustomerId)) {
    return stripeCustomerId;
  }

  logger.warn(BILLING_LOG.CHECKOUT_CUSTOMER_REPLACED, {
    tenantId,
    stripeCustomerId,
  });
  return createSiteCustomer(
    stripe,
    tenantId,
    email,
    `${idempotencyKey}-${stripeCustomerId}`,
  );
};
