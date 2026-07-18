import type { IWithDataTestId, Size } from '@blog/config';
import { BrandMark, type TBrandMarkVariant } from '@blog/ui/atoms/brand-mark';
import type { ComponentPropsWithoutRef } from 'react';

import {
  brandLockupRootVariants,
  brandLockupSpecLineVariants,
  brandLockupTextVariants,
  brandLockupWordmarkVariants,
} from './brand-lockup-variants';

/**
 * Placeholder — the real product name is filled in outside of git history
 * (this repo's public, and the wordmark string must never appear in it).
 * Never replace this with the literal brand name in a commit.
 */
const WORDMARK = 'BRAND';

export interface IBrandLockupProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'children'>, IWithDataTestId {
  variant?: TBrandMarkVariant;
  size?: typeof Size.SM | typeof Size.MD | typeof Size.LG;
  showSpec?: boolean;
  specLine?: string;
}

/**
 * BrandLockup molecule — the brand mark plus the fixed wordmark, with an
 * optional monospace spec line. Mark-only below the `sm` breakpoint
 * (<640px); the wordmark becomes visible at `sm` (≥640px, it stays present
 * for assistive tech below that via `sr-only`) and the spec line reveals at
 * `md` (≥768px), only when both `showSpec` and `specLine` are supplied.
 */
export const BrandLockup = ({
  variant,
  size,
  showSpec,
  specLine,
  className,
  dataTestId,
  ...rest
}: IBrandLockupProps) => {
  const showSpecLine = Boolean(showSpec && specLine);

  return (
    <div
      className={brandLockupRootVariants({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      <BrandMark variant={variant} size={size} />
      <span className={brandLockupTextVariants()}>
        <span className={brandLockupWordmarkVariants()}>{WORDMARK}</span>
        {showSpecLine && (
          <span className={brandLockupSpecLineVariants()}>{specLine}</span>
        )}
      </span>
    </div>
  );
};
