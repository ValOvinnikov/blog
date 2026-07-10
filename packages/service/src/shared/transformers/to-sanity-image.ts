import type { InferFragmentType } from 'groqd';

import type { sanityImageFragment } from '#/shared/fragments/image';

export type TRawSanityImage = InferFragmentType<typeof sanityImageFragment>;

export type TSanityImageHotspot = {
  x: number;
  y: number;
  height: number;
  width: number;
};

export type TSanityImageCrop = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export type TSanityImageDimensions = {
  width: number;
  height: number;
  aspectRatio: number;
};

export type TSanityImage = {
  assetId: string;
  alt: string;
  hotspot: TSanityImageHotspot | undefined;
  crop: TSanityImageCrop | undefined;
  lqip: string | undefined;
  dimensions: TSanityImageDimensions | undefined;
};

function toHotspot(
  raw: TRawSanityImage['hotspot'],
): TSanityImageHotspot | undefined {
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

function toCrop(raw: TRawSanityImage['crop']): TSanityImageCrop | undefined {
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
): TSanityImageDimensions | undefined {
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
): TSanityImage | undefined {
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
