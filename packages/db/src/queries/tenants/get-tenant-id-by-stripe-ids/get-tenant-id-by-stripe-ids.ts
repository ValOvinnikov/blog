import { getDb } from '@blog/db/client';
import { STRIPE_TENANT_LOOKUP_OUTCOME } from '@blog/db/constants';
import { tenants } from '@blog/db/schema/tenants';
import { hasLength, isNull } from '@blog/utils/primitives';
import { eq, or } from 'drizzle-orm';

export type TStripeIds = {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
};

export type TStripeTenantLookup =
  | { outcome: typeof STRIPE_TENANT_LOOKUP_OUTCOME.FOUND; tenantId: string }
  | { outcome: typeof STRIPE_TENANT_LOOKUP_OUTCOME.NOT_FOUND }
  | {
      outcome: typeof STRIPE_TENANT_LOOKUP_OUTCOME.CONFLICT;
      customerTenantId: string;
      subscriptionTenantId: string;
    };

const NOT_FOUND = { outcome: STRIPE_TENANT_LOOKUP_OUTCOME.NOT_FOUND } as const;

export async function getTenantIdByStripeIds({
  stripeCustomerId,
  stripeSubscriptionId,
}: TStripeIds): Promise<TStripeTenantLookup> {
  const conditions = [
    stripeCustomerId ? eq(tenants.stripeCustomerId, stripeCustomerId) : null,
    stripeSubscriptionId
      ? eq(tenants.stripeSubscriptionId, stripeSubscriptionId)
      : null,
  ].filter((condition) => !isNull(condition));

  if (!hasLength(conditions)) {
    return NOT_FOUND;
  }

  const rows = await getDb()
    .select({
      id: tenants.id,
      stripeCustomerId: tenants.stripeCustomerId,
      stripeSubscriptionId: tenants.stripeSubscriptionId,
    })
    .from(tenants)
    .where(or(...conditions));

  const customerTenant = stripeCustomerId
    ? rows.find((row) => row.stripeCustomerId === stripeCustomerId)
    : undefined;
  const subscriptionTenant = stripeSubscriptionId
    ? rows.find((row) => row.stripeSubscriptionId === stripeSubscriptionId)
    : undefined;

  if (
    customerTenant &&
    subscriptionTenant &&
    customerTenant.id !== subscriptionTenant.id
  ) {
    return {
      outcome: STRIPE_TENANT_LOOKUP_OUTCOME.CONFLICT,
      customerTenantId: customerTenant.id,
      subscriptionTenantId: subscriptionTenant.id,
    };
  }

  const tenant = customerTenant ?? subscriptionTenant;

  return tenant
    ? { outcome: STRIPE_TENANT_LOOKUP_OUTCOME.FOUND, tenantId: tenant.id }
    : NOT_FOUND;
}
