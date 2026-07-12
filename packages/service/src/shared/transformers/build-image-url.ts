import { urlForImage } from '@blog/service/sanity/image';
import type { imageWithAltFragment } from '@blog/service/shared/fragments/image';
import type { SanityImageSource } from '@sanity/image-url';
import type { InferFragmentType } from 'groqd';

type TRawImage = InferFragmentType<typeof imageWithAltFragment>;

export function buildImageUrl(
  image: TRawImage | null | undefined,
): string | undefined {
  if (!image?.asset) return undefined;
  try {
    return urlForImage(image as SanityImageSource);
  } catch {
    return undefined;
  }
}
