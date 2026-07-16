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
  /** '_blank' for external links opting into a new tab, else undefined. */
  target: TMaybeUndefined<'_blank'>;
  /** Social platform key (set on footer social links). */
  platform: TMaybeUndefined<TSocialPlatform>;
}
