import imageUrlBuilder, { type SanityImageSource } from '@sanity/image-url';

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
