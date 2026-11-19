import type { TMaybeUndefined } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import { isNotDeprovisioned } from '@shinefold/db/queries/tenants/not-deprovisioned';
import { tenants, type TTenant } from '@shinefold/db/schema/tenants';
import { and, eq } from 'drizzle-orm';

export type TGetTenantByIdOptions = {
  includeArchived?: boolean;
};

export async function getTenantById(
  id: string,
  options: TGetTenantByIdOptions = {},
): Promise<TMaybeUndefined<TTenant>> {
  const db = getDb();

  const conditions = [eq(tenants.id, id)];
  if (!options.includeArchived) {
    conditions.push(isNotDeprovisioned);
  }

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(and(...conditions));

  return tenant;
}
