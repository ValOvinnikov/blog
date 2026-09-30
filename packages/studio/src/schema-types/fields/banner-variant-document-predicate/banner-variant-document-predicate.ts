import { HERO_VARIANT } from '@blog/config/constants';

export const isBannerVariantDocument = ({
  document,
}: {
  document?: unknown;
}): boolean =>
  (document as { variant?: string } | undefined)?.variant ===
  HERO_VARIANT.BANNER;
