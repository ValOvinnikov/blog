import type { TMaybeUndefined } from '@shinefold/config';
import type { TLocaleIsoCode, TTenantPlan } from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { tenants } from '@shinefold/db/schema/tenants';
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
