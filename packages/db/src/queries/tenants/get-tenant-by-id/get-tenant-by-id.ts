import { getDb } from '@blog/db/client';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { and, eq, isNull } from 'drizzle-orm';

export type TGetTenantByIdOptions = {
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
