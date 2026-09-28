'use client';

// `sanity-image` uses `useState` internally (LQIP blur-up), so this bridge
// must be a Client Component boundary when rendered from Server Components.
import type {
  ISanityImage,
  ISanityImageCrop,
  ISanityImageHotspot,
} from '@blog/config';
import type { TMaybeUndefined } from '@blog/config/types';
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

// Without a hotspot, `sanity-image` falls back to an entropy crop, which is
// a heuristic and can land off-centre; a synthetic centre hotspot keeps
// framing deterministic instead.
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

/**
 * Framework-coupled bridge between the service layer's `ISanityImage`
 * view-model and the `sanity-image` package. The CDN origin comes from
 * `useSanityImageBaseUrl` (resolved once per request by the surrounding
 * `SanityImageBaseUrlProvider`), not from the image itself.
 *
 * `preview` (the LQIP blur-up placeholder) is withheld when `priority` is
 * set. When a `preview` is passed, the underlying package renders the real
 * image at `10x10px`/`opacity:0` and only swaps it to full size from a
 * `useEffect`/`onLoad` handler once React has hydrated — gating the LCP
 * element's paint on client hydration rather than on the image request
 * itself. A `priority` image is the page's LCP candidate and already
 * requests eagerly with `fetchPriority="high"`, so it renders straight to
 * its final `<img>` with no hydration-gated placeholder swap.
 *
 * @example
 * <SanityImage image={hero.sanityImage} width={960} height={720} mode="cover" />
 */
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
