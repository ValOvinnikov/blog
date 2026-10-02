import type { IBreadcrumbItem } from '@blog/ui/components/molecules/breadcrumbs';

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

export const buildBreadcrumbListSchema = (
  items: IBreadcrumbItem[],
  base: URL | undefined,
): TBreadcrumbListSchema | undefined => {
  if (!base) return undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: new URL(item.href, base).href,
    })),
  };
};
