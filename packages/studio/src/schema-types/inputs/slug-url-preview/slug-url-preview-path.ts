export const buildSlugUrlPreviewPath = (
  routePrefix: string,
  slug: string | undefined,
): string => `${routePrefix}${slug ?? ''}`;

export const buildNestedRoutePrefix = (
  ancestorSlugs: readonly (string | null | undefined)[],
): string =>
  ['', ...[...ancestorSlugs].reverse().map((slug) => slug ?? ''), ''].join('/');
