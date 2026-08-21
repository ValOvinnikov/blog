'use client';

// `sanity-image` uses `useState` internally (LQIP blur-up), so this bridge
// must be a Client Component boundary when rendered from Server Components.
import type { ISanityImage } from '@blog/config';
import { SanityImage as SanityImageBase } from 'sanity-image';

export interface ISanityImageProps {
  image: ISanityImage;
  baseUrl: string;
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
 * view-model and the `sanity-image` package. `baseUrl` is a plain prop
 * resolved by the caller via `@blog/service`'s `getSanityImageBaseUrl` —
 * this component stays free of any env/service import so it doesn't pull
 * that cost into the client bundle.
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
 * <SanityImage image={hero.sanityImage} baseUrl={baseUrl} width={960} height={720} mode="cover" />
 */
export const SanityImage = ({
  image,
  baseUrl,
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
    baseUrl={baseUrl}
    hotspot={image.hotspot}
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
