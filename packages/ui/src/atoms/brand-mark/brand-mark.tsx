import type { IWithDataTestId, Size } from '@blog/config';
import type { SVGProps } from 'react';

import { brandMarkVariants } from './brand-mark-variants';

export interface IBrandMarkProps
  extends
    Omit<SVGProps<SVGSVGElement>, 'className' | 'title'>,
    IWithDataTestId {
  size?: typeof Size.SM | typeof Size.MD | typeof Size.LG;
  /** Accessible title for standalone use. Omit to keep the mark decorative. */
  title?: string;
  className?: string;
}

/**
 * BrandMark atom — the brand mark as three stacked polygon layers, coloured
 * from the `--logo-1/2/3` design tokens via inline `style` (these tokens
 * aren't mirrored into `@theme inline` as Tailwind utilities). Decorative by
 * default (no accessible name); pass `title` when it's used standalone
 * rather than nested inside a labelled composition.
 */
export const BrandMark = ({
  size,
  title,
  className,
  dataTestId,
  ...rest
}: IBrandMarkProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      className={brandMarkVariants({ size, class: className })}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      data-testid={dataTestId}
      {...rest}
    >
      {title && <title>{title}</title>}
      <polygon points="12,3 22,7 12,11 2,7" style={{ fill: 'var(--logo-1)' }} />
      <polygon
        points="12,8 22,12 12,16 2,12"
        style={{ fill: 'var(--logo-2)' }}
      />
      <polygon
        points="12,13 22,17 12,21 2,17"
        style={{ fill: 'var(--logo-3)' }}
      />
    </svg>
  );
};
