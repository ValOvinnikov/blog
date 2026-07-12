import type {
  ISanityImage,
  ISanityImageCrop,
  ISanityImageDimensions,
  ISanityImageHotspot,
} from '@blog/config';
import type { sanityImageFragment } from '@blog/service/shared/fragments/image';
import type { InferFragmentType } from 'groqd';

export type TRawSanityImage = InferFragmentType<typeof sanityImageFragment>;

function toHotspot(
  raw: TRawSanityImage['hotspot'],
): ISanityImageHotspot | undefined {
  if (
    !raw ||
    raw.x == null ||
    raw.y == null ||
    raw.height == null ||
    raw.width == null
  ) {
    return undefined;
  }

  return { x: raw.x, y: raw.y, height: raw.height, width: raw.width };
}

function toCrop(raw: TRawSanityImage['crop']): ISanityImageCrop | undefined {
  if (
    !raw ||
    raw.top == null ||
    raw.bottom == null ||
    raw.left == null ||
    raw.right == null
  ) {
    return undefined;
  }

  return { top: raw.top, bottom: raw.bottom, left: raw.left, right: raw.right };
}

function toDimensions(
  raw: TRawSanityImage['asset']['metadata'],
): ISanityImageDimensions | undefined {
  const dimensions = raw?.dimensions;
  if (
    !dimensions ||
    dimensions.width == null ||
    dimensions.height == null ||
    dimensions.aspectRatio == null
  ) {
    return undefined;
  }

  return {
    width: dimensions.width,
    height: dimensions.height,
    aspectRatio: dimensions.aspectRatio,
  };
}

export function toSanityImage(
  raw: TRawSanityImage | null | undefined,
): ISanityImage | undefined {
  if (!raw?.asset) return undefined;

  return {
    assetId: raw.asset._id,
    alt: raw.alt,
    hotspot: toHotspot(raw.hotspot),
    crop: toCrop(raw.crop),
    lqip: raw.asset.metadata?.lqip ?? undefined,
    dimensions: toDimensions(raw.asset.metadata),
  };
}
