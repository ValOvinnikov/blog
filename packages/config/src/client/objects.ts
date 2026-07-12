import type { TSocialPlatform } from '@blog/config/constants/link';

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
  hotspot: ISanityImageHotspot | undefined;
  crop: ISanityImageCrop | undefined;
  lqip: string | undefined;
  dimensions: ISanityImageDimensions | undefined;
}

export interface ILink {
  label: string;
  href: string;
  /** '_blank' for external links opting into a new tab, else undefined. */
  target: '_blank' | undefined;
  /** Social platform key (set on footer social links). */
  platform: TSocialPlatform | undefined;
}
