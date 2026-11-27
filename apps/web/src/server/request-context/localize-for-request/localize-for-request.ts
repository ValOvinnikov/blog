import { routing } from '@web/i18n/routing';
import { getRequestContext } from '@web/server/request-context/request-context';
import { toLocalizedPathname } from '@web/utils/to-localized-pathname';

export const localizeForRequest = async (href: string): Promise<string> => {
  const { locale, defaultLocale = routing.defaultLocale } =
    await getRequestContext();

  return toLocalizedPathname({ href, locale, defaultLocale });
};
