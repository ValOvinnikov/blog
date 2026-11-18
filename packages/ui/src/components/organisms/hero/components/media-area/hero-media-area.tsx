import type { THeroMediaProps } from '@shinefold/ui/components/organisms/hero/components/media/hero-media';
import type { THeroStyles } from '@shinefold/ui/components/organisms/hero/hero-styles';
import { HERO_TEST_ID } from '@shinefold/ui/constants/hero';
import { cloneElement, type ReactElement } from 'react';

type THeroMediaAreaProps = {
  media: ReactElement<THeroMediaProps>;
  heroStyles: THeroStyles;
};

export const HeroMediaArea = ({
  media,
  heroStyles: { variant, isBanner, alignment, styles, banner },
}: THeroMediaAreaProps) => (
  <>
    <div
      className={styles.media({ class: banner?.media() })}
      data-testid={HERO_TEST_ID.MEDIA}
    >
      {cloneElement(
        media,
        isBanner
          ? { isFramed: false }
          : { variant, contentAlignment: alignment },
      )}
    </div>
    {banner && (
      <div
        className={banner.overlay()}
        aria-hidden="true"
        data-testid={HERO_TEST_ID.OVERLAY}
      />
    )}
  </>
);
