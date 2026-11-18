import {
  ERROR_CODE,
  type TErrorCode,
  type TLocaleIsoCode,
} from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { listResolvableEntitlementGrants } from '@shinefold/db/queries/tenant-entitlement-grants/list-resolvable-entitlement-grants';
import { getTenantLocales } from '@shinefold/db/queries/tenants/get-tenant-locales';
import { tenants } from '@shinefold/db/schema/tenants';
import { resolveTenantEntitlements } from '@shinefold/db/utils/resolve-tenant-entitlements/resolve-tenant-entitlements';
import { errorResult, okResult, type TResult } from '@shinefold/utils';
import { eq } from 'drizzle-orm';

// Past the limit only already-stored locales are kept, so a downgraded
// tenant can reorder which ones are live without losing the rest.
export async function setTenantAdditionalLocales(
  tenantId: string,
  additionalLocales: TLocaleIsoCode[],
): Promise<TResult<TLocaleIsoCode[], TErrorCode>> {
  const [locales, grants] = await Promise.all([
    getTenantLocales(tenantId),
    listResolvableEntitlementGrants(tenantId),
  ]);

  if (!locales) {
    return errorResult(ERROR_CODE.DB_NOT_FOUND);
  }

  const { defaultLocale, additionalLocales: storedLocales, plan } = locales;
  const uniqueLocales = [...new Set(additionalLocales)];

  if (uniqueLocales.includes(defaultLocale)) {
    return errorResult(ERROR_CODE.DB_DEFAULT_LOCALE_REPEATED);
  }

  const { localeLimit } = resolveTenantEntitlements(plan, grants, new Date());
  const overLimit = uniqueLocales.length + 1 > localeLimit;
  const addsUnstoredLocale = uniqueLocales.some(
    (locale) => !storedLocales.includes(locale),
  );

  if (overLimit && addsUnstoredLocale) {
    return errorResult(ERROR_CODE.DB_LOCALE_LIMIT_EXCEEDED);
  }

  const db = getDb();

  await db
    .update(tenants)
    .set({ additionalLocales: uniqueLocales })
    .where(eq(tenants.id, tenantId));

  return okResult(uniqueLocales);
}
