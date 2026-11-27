import type { TLocaleIsoCode, TMaybeUndefined } from '@shinefold/config';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { routing } from '@web/i18n/routing';
import { resolveNotFoundLocale } from '@web/server/request-context/resolve-not-found-locale/resolve-not-found-locale';

export type TNotFoundContext = {
  tenantId: TMaybeUndefined<string>;
  locale: TLocaleIsoCode;
  defaultLocale: TLocaleIsoCode;
};

export const toNotFoundContext = async (
  row: TMaybeUndefined<TTenant>,
  tenantId: TMaybeUndefined<string>,
  locale: string,
): Promise<TNotFoundContext> => ({
  tenantId,
  locale: await resolveNotFoundLocale(row, locale),
  defaultLocale: row?.locale ?? routing.defaultLocale,
});
