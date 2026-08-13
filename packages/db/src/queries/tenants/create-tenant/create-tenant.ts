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

// Registers a new tenant row. No idempotency built in here (unlike
// `addBookmark`/`createPendingSubscriber`) — `slug` is unique, and a
// duplicate is a genuine caller error the seed script (or, later, the admin
// app's onboarding flow) checks for up front rather than silently no-oping.
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
