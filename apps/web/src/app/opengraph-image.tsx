import {
  buildDefaultSocialImage,
  contentType,
  resolveDefaultSocialImageProps,
  size,
} from '@web/metadata/default-social-image/default-social-image';

export const alt = 'Site preview image';
export { contentType, size };

/**
 * Site-wide default Open Graph image (Console brand variant). Applies
 * wherever a route's resolved `seo.ogImageUrl` is absent (see `toMetadata`)
 * — this is the ultimate fallback, so it resolves its own props rather than
 * accepting them (this file has no access to a parent layout's data).
 */
export default async function Image() {
  const props = await resolveDefaultSocialImageProps('opengraph-image');

  return buildDefaultSocialImage(props);
}
