import type { IWithClassName, IWithDataTestId } from '@blog/config';
import { BrandMark, type TBrandMarkProps } from '@blog/ui/atoms/brand-mark';

import { brandLockupVariants } from './brand-lockup-variants';

export type TBrandLockupProps = IWithClassName &
  IWithDataTestId & {
    /** Uploaded brand-mark image source; falls through to `BrandMark`'s polygon fallback when unset. */
    src?: string;
    size?: TBrandMarkProps['size'];
    specLine?: string;
  };

/**
 * BrandLockup molecule — the brand mark plus an optional monospace spec
 * line, stacked with the mark above. The spec line reveals at `md`
 * (≥768px), only when `specLine` is supplied.
 */
export const BrandLockup = ({
  src,
  size,
  specLine,
  className,
  dataTestId,
}: TBrandLockupProps) => {
  const { root, specLine: specLineSlot } = brandLockupVariants();

  return (
    <div className={root({ class: className })} data-testid={dataTestId}>
      <BrandMark src={src} size={size} stacked={Boolean(specLine)} />
      {specLine && <span className={specLineSlot()}>{specLine}</span>}
    </div>
  );
};
