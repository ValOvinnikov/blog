import {
  ERROR_CODE,
  type TErrorCode,
  type TLocaleIsoCode,
} from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { PLAN_LOCALE_LIMIT } from '@shinefold/db/constants';
import { getTenantLocales } from '@shinefold/db/queries/tenants/get-tenant-locales';
import { tenants } from '@shinefold/db/schema/tenants';
import { errorResult, okResult, type TResult } from '@shinefold/utils';
import { eq } from 'drizzle-orm';

// Past the plan limit only already-stored locales are kept, so a downgraded
// tenant can reorder which ones are live without losing the rest.
export async function setTenantAdditionalLocales(
  tenantId: string,
  additionalLocales: TLocaleIsoCode[],
): Promise<TResult<TLocaleIsoCode[], TErrorCode>> {
  const locales = await getTenantLocales(tenantId);

  if (!locales) {
    return errorResult(ERROR_CODE.DB_NOT_FOUND);
  }

  const { defaultLocale, additionalLocales: storedLocales, plan } = locales;
  const uniqueLocales = [...new Set(additionalLocales)];

  if (uniqueLocales.includes(defaultLocale)) {
    return errorResult(ERROR_CODE.DB_DEFAULT_LOCALE_REPEATED);
  }

  const overPlanLimit = uniqueLocales.length + 1 > PLAN_LOCALE_LIMIT[plan];
  const addsUnstoredLocale = uniqueLocales.some(
    (locale) => !storedLocales.includes(locale),
  );

  if (overPlanLimit && addsUnstoredLocale) {
    return errorResult(ERROR_CODE.DB_LOCALE_LIMIT_EXCEEDED);
  }

  const db = getDb();

  await db
    .update(tenants)
    .set({ additionalLocales: uniqueLocales })
    .where(eq(tenants.id, tenantId));

  return okResult(uniqueLocales);
}
