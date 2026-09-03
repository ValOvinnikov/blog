import type { TMaybeUndefined } from '@blog/config';
import {
  urlForImage,
  type TImageTenant,
  type TImageTransformOptions,
} from '@blog/service/sanity/image';
import type { imageWithAltFragment } from '@blog/service/shared/fragments/image';
import type { SanityImageSource } from '@sanity/image-url';
import type { InferFragmentType } from 'groqd';

export type TRawImage = InferFragmentType<typeof imageWithAltFragment>;

export function buildImageUrl(
  image: TRawImage | null | undefined,
  tenant: TImageTenant,
  options?: TImageTransformOptions,
): TMaybeUndefined<string> {
  if (!image?.asset) return undefined;
  try {
    return urlForImage(image as SanityImageSource, tenant, options);
  } catch {
    return undefined;
  }
}
