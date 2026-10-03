import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config';
import { buildTenantRouting } from '@web/i18n/routing';
import { createNavigation } from 'next-intl/navigation';

type TLocalizedPathnameParams = {
  href: string;
  locale: TLocaleIsoCode;
  defaultLocale: TLocaleIsoCode;
};

export const toLocalizedPathname = ({
  href,
  locale,
  defaultLocale,
}: TLocalizedPathnameParams): string => {
  const { getPathname } = createNavigation(
    buildTenantRouting(defaultLocale, Object.values(LOCALE_ISO_CODES)),
  );

  return getPathname({ href, locale });
};
