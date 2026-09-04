import type { IBreadcrumbItem } from '@blog/ui/molecules/breadcrumbs';

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
 * Returns `undefined` when `siteUrl` is empty, mirroring how
 * `[tenant]/[locale]/layout.tsx` treats an unresolved base URL as "no
 * `metadataBase`" rather than defaulting to `''` — schema.org's
 * `ListItem.item` must be absolute, so silently concatenating an empty
 * `siteUrl` with each item's relative `href` would produce invalid
 * (relative) `item` URLs and fail structured-data validation. Callers skip
 * rendering `<JsonLd>` entirely when this returns `undefined`.
 *
 * @example
 * const schema = buildBreadcrumbListSchema(trail, (await getTenantBaseUrl()) ?? '');
 * return schema ? <JsonLd schema={schema} /> : null;
 */
export const buildBreadcrumbListSchema = (
  items: IBreadcrumbItem[],
  siteUrl: string,
): TBreadcrumbListSchema | undefined => {
  if (!siteUrl) return undefined;

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
};
