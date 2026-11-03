import { LOCALE_BCP47_TAGS, routes } from '@blog/config';
import { localeForPrefix } from '@web/i18n/routing';
import { isReaderAccountEnabledForTenant } from '@web/server/settings-features/is-reader-account-enabled/is-reader-account-enabled';
import type { TTenantRouting } from '@web/server/tenant/resolve-tenant/resolve-tenant';
import { siteUnavailablePage } from '@web/utils/site-unavailable-response';
import type { NextResponse } from 'next/server';

export const operatorSuspendedPage = async (
  firstSegment: string,
  { tenantId, defaultLocale }: TTenantRouting,
): Promise<NextResponse> => {
  const prefixedLocale = localeForPrefix(firstSegment);
  const localePrefix = prefixedLocale
    ? `/${LOCALE_BCP47_TAGS[prefixedLocale]}`
    : '';
  const hasReaderAccounts = await isReaderAccountEnabledForTenant(tenantId);

  return siteUnavailablePage(
    prefixedLocale ?? defaultLocale,
    hasReaderAccounts ? `${localePrefix}${routes.account()}` : undefined,
  );
};
