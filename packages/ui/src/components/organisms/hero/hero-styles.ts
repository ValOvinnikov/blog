import {
  CONTENT_ALIGNMENT,
  HERO_VARIANT,
  MEDIA_ORDER,
} from '@shinefold/config';
import { bannerVariants } from '@shinefold/ui/lib/styling';

import type { THeroLayout, THeroProps } from './hero';
import { heroVariants } from './hero-variants';

type THeroStylesInput = Pick<THeroProps, 'variant'> & {
  hasMedia: boolean;
  layout?: THeroLayout;
};

export const resolveHeroStyles = ({
  variant = HERO_VARIANT.SPLIT,
  hasMedia,
  layout: {
    contentPosition = CONTENT_ALIGNMENT.LEFT,
    contentAlignment,
    mediaOrder,
    spacingTop,
    spacingBottom,
  } = {},
}: THeroStylesInput) => {
  const isBanner = variant === HERO_VARIANT.BANNER;
  const alignment =
    variant === HERO_VARIANT.SPLIT
      ? contentAlignment
      : (contentAlignment ?? CONTENT_ALIGNMENT.LEFT);

  return {
    variant,
    isBanner,
    alignment,
    styles: heroVariants({
      variant,
      hasMedia,
      position: contentPosition,
      alignment,
      mediaOrder: isBanner ? undefined : (mediaOrder ?? MEDIA_ORDER.LAST),
    }),
    banner: isBanner
      ? bannerVariants({
          hasMedia,
          position: contentPosition,
          spacingTop,
          spacingBottom,
        })
      : undefined,
  };
};

export type THeroStyles = ReturnType<typeof resolveHeroStyles>;
