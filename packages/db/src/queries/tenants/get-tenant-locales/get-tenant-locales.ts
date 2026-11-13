import type { TMaybeUndefined } from '@blog/config';
import type { TLocaleIsoCode, TTenantPlan } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

export type TTenantLocales = {
  defaultLocale: TLocaleIsoCode;
  additionalLocales: TLocaleIsoCode[];
  plan: TTenantPlan;
};

export async function getTenantLocales(
  tenantId: string,
): Promise<TMaybeUndefined<TTenantLocales>> {
  const db = getDb();

  const [row] = await db
    .select({
      defaultLocale: tenants.locale,
      additionalLocales: tenants.additionalLocales,
      plan: tenants.plan,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  return row;
}
