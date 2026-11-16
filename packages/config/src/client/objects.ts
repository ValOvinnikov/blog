import type { TImageLayout } from '@shinefold/config/constants/image-layout';
import type { TSocialPlatform } from '@shinefold/config/constants/link';
import type { PORTABLE_TEXT_BLOCK_TYPE } from '@shinefold/config/constants/portable-text-block-type';
import type { TMaybeUndefined } from '@shinefold/config/types';

export interface ISanityImageHotspot {
  x: number;
  y: number;
  height: number;
  width: number;
}

export interface ISanityImageCrop {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface ISanityImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

export interface ISanityImage {
  assetId: string;
  alt: string;
  hotspot: TMaybeUndefined<ISanityImageHotspot>;
  crop: TMaybeUndefined<ISanityImageCrop>;
  lqip: TMaybeUndefined<string>;
  dimensions: TMaybeUndefined<ISanityImageDimensions>;
}

export interface ILink {
  label: string;
  href: string;
  target: TMaybeUndefined<'_blank'>;
  platform: TMaybeUndefined<TSocialPlatform>;
}

export interface IBodyImageBlock {
  _type: typeof PORTABLE_TEXT_BLOCK_TYPE.BODY_IMAGE;
  _key: string;
  layout: TMaybeUndefined<TImageLayout>;
  image: TMaybeUndefined<ISanityImage>;
}
