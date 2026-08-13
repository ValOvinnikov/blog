import type { TTenantPlan, TTenantStatus } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { tenants, type TTenant } from '@blog/db/schema/tenants';

export type TCreateTenantInput = {
  slug: string;
  primaryDomain: string;
  sanityProjectId: string;
  sanityDataset: string;
  locale: string;
  plan: TTenantPlan;
  status: TTenantStatus;
};

// No idempotency here (unlike `addBookmark`/`createPendingSubscriber`) —
// `slug` is unique, and a duplicate is a genuine caller error to check for
// up front, not silently no-op on.
export async function createTenant(
  input: TCreateTenantInput,
): Promise<TTenant> {
  const db = getDb();

  const [tenant] = await db.insert(tenants).values(input).returning();

  if (!tenant) {
    throw new Error(
      `createTenant: insert for slug "${input.slug}" returned no row.`,
    );
  }

  return tenant;
}
