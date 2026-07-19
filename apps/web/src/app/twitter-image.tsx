import {
  buildDefaultSocialImage,
  contentType,
  resolveDefaultSocialImageProps,
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
  const props = await resolveDefaultSocialImageProps('twitter-image');

  return buildDefaultSocialImage(props);
}
