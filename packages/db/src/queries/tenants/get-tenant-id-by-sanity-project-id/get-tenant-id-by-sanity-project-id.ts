import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { asc, eq } from 'drizzle-orm';

// `sanityProjectId` has no unique constraint, so more than one row could
// match; ordering by `createdAt` keeps the resolved tenant deterministic
// (the earliest-provisioned match wins) rather than relying on whatever
// order Postgres happens to return.
export async function getTenantIdBySanityProjectId(
  sanityProjectId: string,
): Promise<string | undefined> {
  const db = getDb();

  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.sanityProjectId, sanityProjectId))
    .orderBy(asc(tenants.createdAt))
    .limit(1);

  return tenant?.id;
}
