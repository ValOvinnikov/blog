import type { IWithDataTestId } from '@blog/config';
import { BrandMark, type IBrandMarkProps } from '@blog/ui/atoms/brand-mark';
import { Logo } from '@blog/ui/atoms/logo';
import type { ComponentPropsWithoutRef } from 'react';

import { brandLockupVariants } from './brand-lockup-variants';

export interface IBrandLockupProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'children'>, IWithDataTestId {
  prefix: string;
  suffix?: string;
  size?: IBrandMarkProps['size'];
  specLine?: string;
}

/**
 * BrandLockup molecule — the brand mark plus the wordmark (via the `Logo`
 * atom), with an optional monospace spec line. The wordmark (prefix+suffix)
 * is visible at every viewport width, scaled down below the `sm` breakpoint
 * (<640px) so it doesn't crowd narrow headers, then growing to its full size
 * at `sm` (≥640px). The spec line reveals at `md` (≥768px), only when
 * `specLine` is supplied.
 */
export const BrandLockup = ({
  prefix,
  suffix,
  size,
  specLine,
  className,
  dataTestId,
  ...rest
}: IBrandLockupProps) => {
  const {
    root,
    text,
    wordmark,
    specLine: specLineSlot,
  } = brandLockupVariants();

  return (
    <div
      className={root({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      <BrandMark size={size} />
      <span className={text()}>
        <Logo prefix={prefix} suffix={suffix} className={wordmark()} />
        {specLine && <span className={specLineSlot()}>{specLine}</span>}
      </span>
    </div>
  );
};
