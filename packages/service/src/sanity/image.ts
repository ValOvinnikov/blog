import {
  createImageUrlBuilder,
  type FitMode,
  type SanityImageSource,
} from '@sanity/image-url';

import { getClient } from './client';

type TImageUrlBuilder = ReturnType<typeof createImageUrlBuilder>;

let builder: TImageUrlBuilder | undefined;

function getImageUrlBuilder(): TImageUrlBuilder {
  builder ??= createImageUrlBuilder(getClient());
  return builder;
}

export type TImageTransformOptions = {
  width?: number;
  height?: number;
  fit?: FitMode;
};

export function urlForImage(
  source: SanityImageSource,
  options?: TImageTransformOptions,
): string {
  let image = getImageUrlBuilder().image(source).auto('format');
  if (options?.width) image = image.width(options.width);
  if (options?.height) image = image.height(options.height);
  if (options?.fit) image = image.fit(options.fit);
  return image.url();
}
