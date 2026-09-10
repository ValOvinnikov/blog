/**
 * Resolves a page's SEO content-derived title: the authored heading, or the
 * site brand name when it's unset or blank.
 */
export function toContentTitle(
  heading: string | undefined,
  brandName: string,
): string {
  return heading?.trim() ? heading : brandName;
}
