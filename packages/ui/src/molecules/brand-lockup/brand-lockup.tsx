import type { IWithDataTestId, Size } from '@blog/config';
import { BrandMark } from '@blog/ui/atoms/brand-mark';
import { Logo } from '@blog/ui/atoms/logo';
import type { ComponentPropsWithoutRef } from 'react';

import { brandLockupVariants } from './brand-lockup-variants';

export interface IBrandLockupProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'children'>, IWithDataTestId {
  prefix: string;
  suffix?: string;
  size?: typeof Size.SM | typeof Size.MD | typeof Size.LG;
  specLine?: string;
}

/**
 * BrandLockup molecule — the brand mark plus the wordmark (via the `Logo`
 * atom), with an optional monospace spec line. Mark-only below the `sm`
 * breakpoint (<640px); the wordmark becomes visible at `sm` (≥640px, it
 * stays present for assistive tech below that via `sr-only`) and the spec
 * line reveals at `md` (≥768px), only when `specLine` is supplied.
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
