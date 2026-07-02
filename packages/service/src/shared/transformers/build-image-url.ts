import type { SanityImageSource } from '@sanity/image-url/lib/types/types';
import type { InferFragmentType } from 'groqd';

import { urlForImage } from '#/sanity/image';
import type { imageWithAltFragment } from '#/shared/fragments/image';

type TRawImage = InferFragmentType<typeof imageWithAltFragment>;

export function buildImageUrl(
  image: TRawImage | null | undefined
): string | undefined {
  if (!image?.asset) return undefined;
  try {
    return urlForImage(image as SanityImageSource);
  } catch {
    return undefined;
  }
}
