import { env } from '@blog/service/utils/env/env';
import {
  createImageUrlBuilder,
  type FitMode,
  type SanityImageSource,
} from '@sanity/image-url';

import { getClient, type TTenantSanityContext } from './client';

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
  quality?: number;
};

export function urlForImage(
  source: SanityImageSource,
  options?: TImageTransformOptions,
): string {
  let image = getImageUrlBuilder().image(source).auto('format');
  if (options?.width) image = image.width(options.width);
  if (options?.height) image = image.height(options.height);
  if (options?.fit) image = image.fit(options.fit);
  if (options?.quality) image = image.quality(options.quality);
  return image.url();
}

/**
 * The `sanity-image` package's own `baseUrl` prop format, as an alternative
 * to passing it separate `projectId`/`dataset` props.
 */
export function getSanityImageBaseUrl(tenant?: TTenantSanityContext): string {
  const projectId = tenant?.projectId ?? env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = tenant?.dataset ?? env.NEXT_PUBLIC_SANITY_DATASET;
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/`;
}
