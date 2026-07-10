import type { ISanityImage } from '@blog/config';
import { SanityImage as SanityImageBase } from 'sanity-image';

import { env } from '@/utils/env/env';

export interface ISanityImageProps {
  image: ISanityImage;
  width: number;
  height?: number;
  mode?: 'cover' | 'contain';
  sizes?: string;
  loading?: 'eager' | 'lazy';
  className?: string;
  alt?: string;
}

/**
 * Framework-coupled bridge between the service layer's `ISanityImage`
 * view-model and the `sanity-image` package. Resolves `projectId`/`dataset`
 * from the validated env module so routes never read `process.env` or the
 * raw Sanity SDK directly.
 *
 * @example
 * <SanityImage image={hero.sanityImage} width={960} height={720} mode="cover" />
 */
export const SanityImage = ({
  image,
  width,
  height,
  mode,
  sizes,
  loading,
  className,
  alt,
}: ISanityImageProps) => (
  <SanityImageBase
    id={image.assetId}
    projectId={env.NEXT_PUBLIC_SANITY_PROJECT_ID}
    dataset={env.NEXT_PUBLIC_SANITY_DATASET}
    hotspot={image.hotspot}
    crop={image.crop}
    preview={image.lqip}
    width={width}
    height={height}
    mode={mode}
    sizes={sizes}
    loading={loading}
    className={className}
    alt={alt ?? image.alt}
  />
);
