import {
  ERROR_CODE,
  type TErrorCode,
  type TLocaleIsoCode,
} from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { PLAN_LOCALE_LIMIT } from '@blog/db/constants';
import { getTenantLocales } from '@blog/db/queries/tenants/get-tenant-locales';
import { tenants } from '@blog/db/schema/tenants';
import type { TResult } from '@blog/utils';
import { eq } from 'drizzle-orm';

export async function setTenantAdditionalLocales(
  tenantId: string,
  additionalLocales: TLocaleIsoCode[],
): Promise<TResult<TLocaleIsoCode[], TErrorCode>> {
  const locales = await getTenantLocales(tenantId);

  if (!locales) {
    return { ok: false, error: ERROR_CODE.DB_NOT_FOUND };
  }

  const { defaultLocale, plan } = locales;
  const uniqueLocales = [...new Set(additionalLocales)];

  if (uniqueLocales.includes(defaultLocale)) {
    return { ok: false, error: ERROR_CODE.DB_DEFAULT_LOCALE_REPEATED };
  }

  if (uniqueLocales.length + 1 > PLAN_LOCALE_LIMIT[plan]) {
    return { ok: false, error: ERROR_CODE.DB_LOCALE_LIMIT_EXCEEDED };
  }

  const db = getDb();

  await db
    .update(tenants)
    .set({ additionalLocales: uniqueLocales })
    .where(eq(tenants.id, tenantId));

  return { ok: true, data: uniqueLocales };
}
