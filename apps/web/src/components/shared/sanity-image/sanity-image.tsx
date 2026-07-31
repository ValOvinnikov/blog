'use client';

// `sanity-image` uses `useState` internally (LQIP blur-up), so this bridge
// must be a Client Component boundary when rendered from Server Components.
import type { ISanityImage } from '@blog/config';
import { SanityImage as SanityImageBase } from 'sanity-image';

export interface ISanityImageProps {
  image: ISanityImage;
  projectId: string;
  dataset: string;
  width: number;
  height?: number;
  mode?: 'cover' | 'contain';
  sizes?: string;
  loading?: 'eager' | 'lazy';
  /**
   * Set on the confirmed LCP image of a page (e.g. a hero) to hint
   * `fetchPriority="high"` on the image request. Never set by default —
   * only one image per page should carry it.
   */
  priority?: boolean;
  className?: string;
  alt?: string;
}

/**
 * Framework-coupled bridge between the service layer's `ISanityImage`
 * view-model and the `sanity-image` package. `projectId`/`dataset` are
 * plain props resolved by the caller from the validated env module — this
 * component stays free of any env/validation import so it doesn't pull that
 * cost into the client bundle.
 *
 * @example
 * <SanityImage image={hero.sanityImage} projectId={projectId} dataset={dataset} width={960} height={720} mode="cover" />
 */
export const SanityImage = ({
  image,
  projectId,
  dataset,
  width,
  height,
  mode = 'cover',
  sizes,
  loading = 'eager',
  priority = false,
  className,
  alt,
}: ISanityImageProps) => (
  <SanityImageBase
    id={image.assetId}
    projectId={projectId}
    dataset={dataset}
    hotspot={image.hotspot}
    crop={image.crop}
    preview={image.lqip}
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
