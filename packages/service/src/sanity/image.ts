import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';
import { client } from './client';

const builder = imageUrlBuilder(client);

export function urlForImage(source: SanityImageSource): string {
  return builder.image(source).auto('format').url();
}
