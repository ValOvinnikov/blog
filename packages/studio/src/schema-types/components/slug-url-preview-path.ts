/**
 * Full resulting route for a per-entity page's slug — e.g. prefix `/topics/`
 * plus slug `my-topic` renders `/topics/my-topic`. Split out from the input
 * component so it's testable without a React/Sanity runtime.
 */
export const buildSlugUrlPreviewPath = (
  routePrefix: string,
  slug: string | undefined,
): string => `${routePrefix}${slug ?? ''}`;
