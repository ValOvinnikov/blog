import imageUrlBuilder from '@sanity/image-url';
import { client } from './client';

const builder = imageUrlBuilder(client);

// Derive the accepted source type from the builder's own method signature
// to stay in sync with whatever version of @sanity/image-url is installed.
type ImageSource = Parameters<(typeof builder)['image']>[0];

/**
 * Build a CDN URL for a Sanity image source.
 * Returns null when source is falsy (unset image field).
 */
export function urlForImage(
  source: ImageSource | null | undefined
): string | null {
  if (!source) {
    return null;
  }
  return builder.image(source).auto('format').url();
}
