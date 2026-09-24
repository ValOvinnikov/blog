import type { IWithClassName, IWithDataTestId } from '@blog/config';
import {
  BrandMark,
  type TBrandMarkProps,
} from '@blog/ui/components/atoms/brand-mark';

import { brandLockupVariants } from './brand-lockup-variants';

export type TBrandLockupProps = IWithClassName &
  IWithDataTestId & {
    src?: string;
    size?: TBrandMarkProps['size'];
    tagline?: string;
  };

/** The brand mark plus an optional monospace tagline, stacked with the mark above. */
export const BrandLockup = ({
  src,
  size,
  tagline,
  className,
  dataTestId,
}: TBrandLockupProps) => {
  const { root, tagline: taglineSlot } = brandLockupVariants();

  return (
    <div className={root({ class: className })} data-testid={dataTestId}>
      <BrandMark src={src} size={size} isStacked={Boolean(tagline)} />
      {tagline && <span className={taglineSlot()}>{tagline}</span>}
    </div>
  );
};
