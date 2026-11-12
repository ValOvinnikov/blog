import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { eq, or } from 'drizzle-orm';

export type TStripeIds = {
  stripeCustomerId: string;
  stripeSubscriptionId: string;
};

export async function getTenantIdByStripeIds({
  stripeCustomerId,
  stripeSubscriptionId,
}: TStripeIds): Promise<TMaybeUndefined<string>> {
  const rows = await getDb()
    .select({ id: tenants.id, stripeCustomerId: tenants.stripeCustomerId })
    .from(tenants)
    .where(
      or(
        eq(tenants.stripeCustomerId, stripeCustomerId),
        eq(tenants.stripeSubscriptionId, stripeSubscriptionId),
      ),
    );

  const customerMatch = rows.find(
    (row) => row.stripeCustomerId === stripeCustomerId,
  );

  return (customerMatch ?? rows[0])?.id;
}
