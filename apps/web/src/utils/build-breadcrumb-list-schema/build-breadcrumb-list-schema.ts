import type { IBreadcrumbItem } from '@blog/ui/components/molecules/breadcrumbs';
import { routing } from '@web/i18n/routing';
import { getRequestContext } from '@web/server/request-context/request-context';
import { toLocalizedPathname } from '@web/utils/to-localized-pathname';

export type TBreadcrumbListSchema = {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }>;
};

export const buildBreadcrumbListSchema = async (
  items: IBreadcrumbItem[],
): Promise<TBreadcrumbListSchema | undefined> => {
  const {
    metadataBase,
    locale,
    defaultLocale = routing.defaultLocale,
  } = await getRequestContext();
  if (!metadataBase) return undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: new URL(
        toLocalizedPathname({ href: item.href, locale, defaultLocale }),
        metadataBase,
      ).href,
    })),
  };
};
