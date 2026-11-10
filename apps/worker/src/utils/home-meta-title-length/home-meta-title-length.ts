import {
  SEO_META_TITLE_MAX_LENGTH,
  SEO_META_TITLE_MIN_LENGTH,
} from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';

export function assertHomeMetaTitleLength(
  tenantId: TTenant['id'],
  metaTitle: string,
): void {
  const { length } = metaTitle;
  if (
    length < SEO_META_TITLE_MIN_LENGTH ||
    length > SEO_META_TITLE_MAX_LENGTH
  ) {
    throw new Error(
      `verifyTenantSeededContent: tenant "${tenantId}"'s "page_home" has a seo.metaTitle of ${length} characters, outside the ${SEO_META_TITLE_MIN_LENGTH}-${SEO_META_TITLE_MAX_LENGTH} bound the SEO schema requires — re-run the "Seed content" step.`,
    );
  }
}
