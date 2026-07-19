import { service } from '@blog/service';
import {
  buildDefaultSocialImage,
  contentType,
  size,
} from '@web/metadata/default-social-image/default-social-image';

export const alt = 'Site preview image';
export { contentType, size };

/**
 * Site-wide default Open Graph image (Console brand variant). Applies
 * wherever a route's resolved `seo.ogImageUrl` is absent (see `toMetadata`)
 * — this is the ultimate fallback, so it fetches `siteSettings` itself
 * rather than accepting props (this file has no access to a parent layout's
 * data) and degrades to a brand-mark-only image if that fetch fails.
 */
export default async function Image() {
  const result = await service.global.siteSettings.v1.getSiteSettings();

  if (!result.ok) {
    console.error(
      `Error fetching site settings for opengraph-image: ${result.error}`,
    );
    return buildDefaultSocialImage({});
  }

  const { brand, tagline } = result.data;

  return buildDefaultSocialImage({ brandName: brand.name, tagline });
}
