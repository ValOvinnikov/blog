import type { IBreadcrumbItem } from '@blog/ui/molecules';

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

/**
 * Builds a `BreadcrumbList` JSON-LD schema object from the same trail fed
 * into the `Breadcrumbs` component — feed the result straight into
 * `<JsonLd schema={...} />`.
 *
 * `position` is 1-based per schema.org's `ListItem` convention. `item` is an
 * absolute URL (`siteUrl` + the item's relative `href`) since schema.org
 * requires `ListItem.item` to be absolute.
 *
 * @example
 * const schema = buildBreadcrumbListSchema(trail, env.NEXT_PUBLIC_SITE_URL ?? '');
 * return <JsonLd schema={schema} />;
 */
export function buildBreadcrumbListSchema(
  items: IBreadcrumbItem[],
  siteUrl: string,
): TBreadcrumbListSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: `${siteUrl}${item.href}`,
    })),
  };
}
