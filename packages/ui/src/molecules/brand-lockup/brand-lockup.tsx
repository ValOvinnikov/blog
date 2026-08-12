import type { IWithDataTestId } from '@blog/config';
import { BrandMark, type IBrandMarkProps } from '@blog/ui/atoms/brand-mark';
import type { ComponentPropsWithoutRef } from 'react';

import { brandLockupVariants } from './brand-lockup-variants';

export interface IBrandLockupProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'children'>, IWithDataTestId {
  /** Uploaded brand-mark image source; falls through to `BrandMark`'s polygon fallback when unset. */
  src?: string;
  size?: IBrandMarkProps['size'];
  specLine?: string;
}

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
  ...rest
}: IBrandLockupProps) => {
  const { root, specLine: specLineSlot } = brandLockupVariants();

  return (
    <div
      className={root({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      <BrandMark src={src} size={size} stacked={Boolean(specLine)} />
      {specLine && <span className={specLineSlot()}>{specLine}</span>}
    </div>
  );
};
