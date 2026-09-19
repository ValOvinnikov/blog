import type { TImageLayout } from '@blog/config/constants/image-layout';
import type { TSocialPlatform } from '@blog/config/constants/link';
import type { TMaybeUndefined } from '@blog/config/types';

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
  ariaLabel: TMaybeUndefined<string>;
}

export interface IBodyImageBlock {
  _type: 'bodyImage';
  _key: string;
  layout: TMaybeUndefined<TImageLayout>;
  image: TMaybeUndefined<ISanityImage>;
}
