import { getDb } from '@blog/db/client';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { and, eq, isNull } from 'drizzle-orm';

export type TGetTenantBySlugOptions = {
  // A deprovisioned tenant's slug stays reserved (its unique constraint
  // isn't relaxed), so callers that must see it regardless — e.g. checking
  // slug availability before creating a new tenant — opt in explicitly.
  includeArchived?: boolean;
};

export async function getTenantBySlug(
  slug: string,
  options: TGetTenantBySlugOptions = {},
): Promise<TTenant | undefined> {
  const db = getDb();

  const conditions = [eq(tenants.slug, slug)];
  if (!options.includeArchived) {
    conditions.push(isNull(tenants.deprovisionedAt));
  }

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(and(...conditions));

  return tenant;
}
