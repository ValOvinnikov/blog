import { BRAND_VARIANTS, type TBrandVariants } from '@blog/config';
import { service } from '@blog/service';
import { buildBrandIconSvg } from '@web/utils/brand-icon-svg';

export const contentType = 'image/svg+xml';

/**
 * Dynamic favicon route (Next.js's code-generated `icon` file convention) —
 * replaces the old static `icon.svg`, which could only ever render the
 * Console brand mark. Reads `brand.variant` from `getSiteSettings()` (same
 * fetch, cache tag, and fallback pattern as `layout.tsx`: a fetch failure
 * logs and defaults to Console rather than throwing, since a broken favicon
 * must never break the page it's attached to) and recolors the mark
 * accordingly. The generated SVG still embeds its own
 * `prefers-color-scheme` media query — light/dark stays a client decision,
 * only the variant's fill constants are resolved here.
 */
export default async function Icon() {
  const result = await service.global.siteSettings.v1.getSiteSettings();

  let variant: TBrandVariants = BRAND_VARIANTS.CONSOLE;
  if (result.ok) {
    variant = result.data.brand.variant;
  } else {
    console.error(`Error fetching site settings for icon: ${result.error}`);
  }

  return new Response(buildBrandIconSvg(variant), {
    headers: { 'Content-Type': contentType },
  });
}
