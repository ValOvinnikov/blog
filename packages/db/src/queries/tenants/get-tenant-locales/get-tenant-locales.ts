import type { TLocaleIsoCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import type { TTenantPlan } from '@blog/db/constants';
import { tenants } from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

export type TTenantLocales = {
  defaultLocale: TLocaleIsoCode;
  additionalLocales: TLocaleIsoCode[];
  plan: TTenantPlan;
};

export async function getTenantLocales(
  tenantId: string,
): Promise<TTenantLocales | undefined> {
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
