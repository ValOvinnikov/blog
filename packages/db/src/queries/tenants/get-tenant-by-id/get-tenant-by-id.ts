import { getDb } from '@blog/db/client';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { and, eq, isNull } from 'drizzle-orm';

export type TGetTenantByIdOptions = {
  // A deprovisioned tenant's id stays valid for lookup by callers that must
  // see it regardless — e.g. a platform operator viewing an archived tenant.
  includeArchived?: boolean;
};

export async function getTenantById(
  id: string,
  options: TGetTenantByIdOptions = {},
): Promise<TTenant | undefined> {
  const db = getDb();

  const conditions = [eq(tenants.id, id)];
  if (!options.includeArchived) {
    conditions.push(isNull(tenants.deprovisionedAt));
  }

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(and(...conditions));

  return tenant;
}
