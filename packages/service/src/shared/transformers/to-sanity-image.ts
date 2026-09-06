import type {
  ISanityImage,
  ISanityImageCrop,
  ISanityImageDimensions,
  ISanityImageHotspot,
  TMaybeUndefined,
} from '@blog/config';
import type { TImageTenant } from '@blog/service/sanity/image';
import { getSanityImageBaseUrl } from '@blog/service/sanity/image-base-url';
import type { sanityImageFragment } from '@blog/service/shared/fragments/image';
import type { InferFragmentType } from 'groqd';

export type TRawSanityImage = InferFragmentType<typeof sanityImageFragment>;

// Same shape as `TRawSanityImage`, but the asset is nullable — accepted so a
// `bodyImage` block whose asset was never selected, or points at a deleted
// document (`bodyImageFragment`'s shape), is a valid argument too.
type TRawSanityImageInput = Omit<TRawSanityImage, 'asset'> & {
  asset: TRawSanityImage['asset'] | null;
};

function toHotspot(
  raw: TRawSanityImageInput['hotspot'],
): TMaybeUndefined<ISanityImageHotspot> {
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

function toCrop(
  raw: TRawSanityImageInput['crop'],
): TMaybeUndefined<ISanityImageCrop> {
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
  raw: NonNullable<TRawSanityImageInput['asset']>['metadata'],
): TMaybeUndefined<ISanityImageDimensions> {
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
  raw: TRawSanityImageInput | null | undefined,
  tenant: TImageTenant,
): TMaybeUndefined<ISanityImage> {
  if (!raw?.asset) return undefined;

  return {
    assetId: raw.asset._id,
    alt: raw.alt,
    cdnBaseUrl: getSanityImageBaseUrl(tenant),
    hotspot: toHotspot(raw.hotspot),
    crop: toCrop(raw.crop),
    lqip: raw.asset.metadata?.lqip ?? undefined,
    dimensions: toDimensions(raw.asset.metadata),
  };
}
