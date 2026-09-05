import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

// `sanityProjectId` carries a unique index, so at most one row can ever
// match — no ordering is needed to make the result deterministic.
export async function getTenantIdBySanityProjectId(
  sanityProjectId: string,
): Promise<string | undefined> {
  const db = getDb();

  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.sanityProjectId, sanityProjectId));

  return tenant?.id;
}
