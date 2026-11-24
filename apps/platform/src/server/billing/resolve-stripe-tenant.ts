import 'server-only';

import {
  BILLING_LOG,
  STRIPE_TENANT_METADATA_KEY,
} from '@platform/constants/billing';
import { logger } from '@platform/utils/logger/logger';
import { tenantIdSchema } from '@platform/utils/tenant-id-schema/tenant-id-schema';
import type { TMaybeUndefined } from '@shinefold/config';
import { queries, STRIPE_TENANT_LOOKUP_OUTCOME } from '@shinefold/db';
import type Stripe from 'stripe';

export const resolveStripeTenant = async (
  subscription: Stripe.Subscription,
  customerId: string,
): Promise<TMaybeUndefined<string>> => {
  const { id: subscriptionId, metadata } = subscription;
  const lookup = await queries.tenants.getTenantIdByStripeIds({
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
  });

  if (lookup.outcome === STRIPE_TENANT_LOOKUP_OUTCOME.FOUND) {
    return lookup.tenantId;
  }
  if (lookup.outcome === STRIPE_TENANT_LOOKUP_OUTCOME.CONFLICT) {
    logger.error(BILLING_LOG.TENANT_CONFLICT, {
      subscriptionId,
      customerTenantId: lookup.customerTenantId,
      subscriptionTenantId: lookup.subscriptionTenantId,
    });
    return undefined;
  }

  const metadataTenantId = tenantIdSchema.safeParse(
    metadata[STRIPE_TENANT_METADATA_KEY],
  );
  const tenant = metadataTenantId.success
    ? await queries.tenants.getTenantById(metadataTenantId.data)
    : undefined;
  if (!tenant) {
    logger.error(BILLING_LOG.TENANT_NOT_FOUND, { subscriptionId });
    return undefined;
  }
  return tenant.id;
};
