'use client';

// `sanity-image` holds state for its LQIP blur-up, so it needs a client boundary.
import type {
  ISanityImage,
  ISanityImageCrop,
  ISanityImageHotspot,
  TMaybeUndefined,
} from '@shinefold/config';
import { useSanityImageBaseUrl } from '@web/context/sanity-image-base-url-provider';
import { SanityImage as SanityImageBase } from 'sanity-image';

export interface ISanityImageProps {
  image: ISanityImage;
  width: number;
  height?: number;
  mode?: 'cover' | 'contain';
  sizes?: string;
  loading?: 'eager' | 'lazy';
  priority?: boolean;
  className?: string;
  alt?: string;
}

// Without a hotspot `sanity-image` uses an entropy crop, which can land off-centre.
const toCenterFocalPoint = (
  crop: TMaybeUndefined<ISanityImageCrop>,
): ISanityImageHotspot => {
  const { top = 0, bottom = 0, left = 0, right = 0 } = crop ?? {};

  return {
    x: left + (1 - left - right) / 2,
    y: top + (1 - top - bottom) / 2,
    width: 1,
    height: 1,
  };
};

export const SanityImage = ({
  image,
  width,
  height,
  mode = 'cover',
  sizes,
  loading = 'eager',
  priority = false,
  className,
  alt,
}: ISanityImageProps) => {
  const baseUrl = useSanityImageBaseUrl();

  return (
    <SanityImageBase
      id={image.assetId}
      baseUrl={baseUrl}
      hotspot={image.hotspot ?? toCenterFocalPoint(image.crop)}
      crop={image.crop}
      // A preview gates the full-size swap on hydration, which would delay the LCP image.
      preview={priority ? undefined : image.lqip}
      width={width}
      height={height}
      mode={mode}
      sizes={sizes}
      loading={loading}
      fetchPriority={priority ? 'high' : undefined}
      className={className}
      alt={alt ?? image.alt}
    />
  );
};
