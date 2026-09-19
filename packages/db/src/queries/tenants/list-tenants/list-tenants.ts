import { getDb } from '@blog/db/client';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { asc, isNull } from 'drizzle-orm';

export type TListTenantsOptions = {
  includeArchived?: boolean;
};

export async function listTenants(
  options: TListTenantsOptions = {},
): Promise<TTenant[]> {
  const db = getDb();

  if (!options.includeArchived) {
    return db
      .select()
      .from(tenants)
      .where(isNull(tenants.deprovisionedAt))
      .orderBy(asc(tenants.name));
  }

  return db.select().from(tenants).orderBy(asc(tenants.name));
}
