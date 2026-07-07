import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

import { getClient } from './client';

type TImageUrlBuilder = ReturnType<typeof imageUrlBuilder>;

let builder: TImageUrlBuilder | undefined;

function getImageUrlBuilder(): TImageUrlBuilder {
  builder ??= imageUrlBuilder(getClient());
  return builder;
}

export function urlForImage(source: SanityImageSource): string {
  return getImageUrlBuilder().image(source).auto('format').url();
}
