import type { IWithClassName, IWithDataTestId } from '@shinefold/config';
import {
  BrandMark,
  type TBrandMarkProps,
} from '@shinefold/ui/components/atoms/brand-mark';

import { brandLockupVariants } from './brand-lockup-variants';

export type TBrandLockupProps = IWithClassName &
  IWithDataTestId & {
    src?: string;
    darkSrc?: string;
    siteName?: string;
    size?: TBrandMarkProps['size'];
    tagline?: string;
  };

/** The brand mark plus an optional monospace tagline, stacked with the mark above. */
export const BrandLockup = ({
  src,
  darkSrc,
  siteName,
  size,
  tagline,
  className,
  dataTestId,
}: TBrandLockupProps) => {
  const s = brandLockupVariants();
  const isStacked = Boolean(tagline);
  const hasDarkMark = Boolean(src && darkSrc);

  return (
    <div className={s.root({ class: className })} data-testid={dataTestId}>
      <BrandMark
        src={src}
        siteName={siteName}
        size={size}
        isStacked={isStacked}
        className={hasDarkMark ? s.lightMark() : undefined}
      />
      {hasDarkMark && (
        <BrandMark
          src={darkSrc}
          siteName={siteName}
          size={size}
          isStacked={isStacked}
          className={s.darkMark()}
        />
      )}
      {tagline && <span className={s.tagline()}>{tagline}</span>}
    </div>
  );
};
