import { service } from '@blog/service';
import {
  buildDefaultSocialImage,
  contentType,
  size,
} from '@web/metadata/default-social-image/default-social-image';

export const alt = 'Site preview image';
export { contentType, size };

/**
 * Site-wide default Twitter card image (Console brand variant) — same
 * 1200×630 `summary_large_image` dimensions and renderer as
 * `opengraph-image.tsx`; see that file for the fallback-ladder rationale.
 */
export default async function Image() {
  const result = await service.global.siteSettings.v1.getSiteSettings();

  if (!result.ok) {
    console.error(
      `Error fetching site settings for twitter-image: ${result.error}`,
    );
    return buildDefaultSocialImage({});
  }

  const { brand, tagline } = result.data;

  return buildDefaultSocialImage({ brandName: brand.name, tagline });
}
